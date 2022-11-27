import sqlite3
import re
import bcrypt
import trade as tr
import database as db

import os 
path = os.getcwd()
path = path[:path.index("react_app")] + 'react_app/'
dbPath = path + 'backend/users.db'

startingCapital = 50000

# Ensures email is in a valid format
def valid_email(email):
    # Regex to match
    em = db.sanitiseInput(email)
    if re.match( r"(^[a-zA-Z0-9.+-_]+@[a-zA-Z0-9-]+\.[a-zA-Z.0-9-]+$)", em):
        return True
    return False

# Ensures password meets NIST Standards
def valid_password(password):
    # Check password length
    if len(password) < 8:
        return False
    if len(password) > 64:
        return False
    return True

# Checks if account is already in database
def account_exist(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    em = db.sanitiseInput(email)
    sql = 'SELECT email FROM account WHERE email=\'{}\''.format(em)
    cur.execute(sql)
    results = cur.fetchall()
    conn.close()
    if len(results) == 0:
        return False
    # If pass check then account exists
    return True

# Retrieve password for a given account
def get_password(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    em = db.sanitiseInput(email)
    sql = 'SELECT password FROM account WHERE email=\'{}\''.format(em)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    if len(result) == 0:
        return ''
    else:
        return result[0][0]

# Check that credentials match to allow login
def match_credentials(email, password):
    em = db.sanitiseInput(email)
    hashed = get_password(em)
    if hashed == '' or bcrypt.checkpw(password.encode(), hashed.encode()) == False:
        return False
    return True

# Create account by adding valid email,password combination to database
def createAccount(email, password, securityQ, securityA):
    if valid_email(email) is False:
        raise Exception('Invalid email')
    if valid_password(password) is False:
        raise Exception('Invalid password')
    if account_exist(email) is True:
        raise Exception('Account exists')
    # Completed checks, add to database
    em = db.sanitiseInput(email)
    hashedPass = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    hashedA = bcrypt.hashpw(securityA.encode(), bcrypt.gensalt())
    try:
        hashedPass = hashedPass.decode()
        hashedA = hashedA.decode()
    except:
        pass
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES ' + \
    '(\'{}\', \'{}\', {}, \'{}\', \'{}\')'.format(email, hashedPass,startingCapital, securityQ, hashedA)
    cur.execute(sql)
    conn.commit()
    conn.close()

# Remove an account from the database given the email and two password entries.
def removeAccount(email, password, repeat_password):
    # Error checking
    err = {
        'success': True
    }
    # Checking password errors
    if account_exist(email) is False:
        err['success'] = False
        err['passErr'] = 'Account does not exist'
    elif match_credentials(email, password) is False:
        err['success'] = False
        err['passErr'] = 'Incorrect password'
    else:
        err['passErr'] = ''
    
    #  Checking password repeat errors
    if password != repeat_password:
        err['success'] = False
        err['passRepErr'] = 'Passwords do not match'
    else:
        err['passRepErr'] = ''
    
    if err['success'] == False:
        return err

    # Delete user record in every user tables
    user_id = tr.getUserId(email)
    tables = ['watchlist','portfolio','betting','bet_history','account']
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    for table in tables:
        sql = 'delete FROM {} WHERE user_id = {}'.format(table,user_id)
        cur.execute(sql)
    conn.commit()
    conn.close()
    return err

# Change the password for a given account
# Assumes the account exists.
def changePassword(email, password):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    try:
        hashed = hashed.decode()
    except:
        pass
    sql = 'UPDATE account SET password = \'{}\' WHERE email=\'{}\''.format(hashed, email)
    cur.execute(sql)
    conn.commit()
    conn.close()

# Given an email, returns the users security question
def getSecurityQ(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT secQ FROM account WHERE email=\'{}\''.format(email)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    return result[0][0]

# Given an email, returns the user's hashed security question answer
def getSecurityA(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    em = db.sanitiseInput(email)
    sql = 'SELECT secA FROM account WHERE email=\'{}\''.format(em)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    if len(result) == 0:
        return ''
    else:
        return result[0][0]

# Checks if a user's entered security answer matches one stored in database
def matchSecurity(email, answer):
    em = db.sanitiseInput(email)
    hashed = getSecurityA(em)
    if hashed == '' or bcrypt.checkpw(answer.encode(), hashed.encode()) == False:
        return False
    return True

# Checks for multiple errors when changing a password.
def changePasswordErrCheck(info):
    data = info["state"]
    result = {
            'oldPassError': '',
            'newPassError': '',
            'newPassRepError': '',
            'allowChange': True
        }
    user = data['user']
    # Check if the current password is correct
    if not (match_credentials(data['user'], data['old_pass'])):
        result['allowChange']=False
        result["oldPassError"] = 'Incorrect password!' 

    # Check if the new password matches the old one
    if (data['new_pass'] == data['old_pass']):
        result['allowChange']=False
        result["newPassError"] = 'New password is the same as the current password!' 

    # Only allow password change if the passwords meets the criteria
    if(result["oldPassError"] != '' and result["newPassError"] != ''):
        result["allowChange"] = False 

    # Check if new password is valid
    if not (valid_password(data['new_pass'])):
        result["newPassError"] = 'Password does not match criteria'
    
    # Check if both passwords match
    if not (data['new_pass'] == data['repeat_new_pass']):
        result["newPassRepError"] = 'New password does not match!'
    if result["allowChange"] == True and result["newPassError"] == '' and result["newPassRepError"] == '' :
        changePassword(user, data['new_pass'])
    else:
        result["allowChange"] = False
    return result

# Checks for multiple errors when restting a password
def forgotPassword(info):
    data = info['state']
    result = {
            'emailError': '',
            'newPassError': '',
            'newPassRepError': '',
            'securityAError': '',
            'allowChange': True
        }
    user = data['email']
    # Check if the current password is correct
    if not matchSecurity(data["email"], data["securityA"]):
            result["securityAError"] = "Incorrect security answer"

        # check if account exists
    if not (account_exist(data["email"])):
        result["emailError"] = "Account doesn't exist"
    
    if(result["emailError"] != '' and result["securityAError"] != ''):
        result["allowChange"] = False

   # Check if new password is valid
    if not (valid_password(data['new_pass'])):
        result["newPassError"] = 'Password does not match criteria'
    
    # Check if both passwords match
    if not (data['new_pass'] == data['repeat_new_pass']):
        result["newPassRepError"] = 'New password does not match!'

    # If no errors, change the password
    if result["allowChange"] == True and result["newPassError"] == '' and result["newPassRepError"] == '' :
        changePassword(user, data['new_pass'])
    else:
        result["allowChange"] = False

    return result