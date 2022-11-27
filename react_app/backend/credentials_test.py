import pytest
import sqlite3
import database as db
import credentials as cr
import watchlist as wl
import trade as tr
import bcrypt
import betting as bt
import os, json

# Setup testdb, first remove existing copies
def pytest_setup():
    if os.path.isfile('testdb.db'):
        os.remove('testdb.db')
    db.dbPath = os.path.abspath('testdb.db')
    cr.dbPath = os.path.abspath('testdb.db')
    wl.dbPath = os.path.abspath('testdb.db')
    tr.dbPath = os.path.abspath('testdb.db')
    bt.dbPath = os.path.abspath('testdb.db')
    db.initialise()

    # Setup testdb
    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()
    email = 'test@gmail.com'
    secQ = 'question'
    secA = 'answer'
    hashedPass = bcrypt.hashpw(b'password1', bcrypt.gensalt()).decode()
    hashedA = bcrypt.hashpw(b'answer', bcrypt.gensalt()).decode()
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES (\'{}\', \'{}\', 10000000,\'{}\',\'{}\')'.format(email, hashedPass , secQ , hashedA)
    cur.execute(sql)
    conn.commit()

# Run pytest_setup once at start of tests
pytest_setup()

def test_valid_email():
    # Valid email formats
    email1 = 'test@gmail.com'
    email2 = 'z123@student.unsw.edu.au'
    # invalid email formats
    email3 = 'jhdsgA'
    email4 = ''
    email5 = '@'
    assert True == cr.valid_email(email1)
    assert True == cr.valid_email(email2)
    assert False == cr.valid_email(email3)
    assert False == cr.valid_email(email4)
    assert False == cr.valid_email(email5)

def test_valid_password():
    short ='a'
    long_password = 'abc'*100
    valid = '1234567890'
    assert False == cr.valid_password(short)
    assert False == cr.valid_password(long_password)
    assert True == cr.valid_password(valid)

def test_account_exist():
    # email manually added to the test db
    exist = 'test@gmail.com'
    not_exist = 'hello@gmail.com'
    assert True == cr.account_exist(exist)
    assert False == cr.account_exist(not_exist)

def test_get_password():
    # password manually entered into test db
    exist = 'test@gmail.com'
    not_exist = 'hello@gmail.com'
    correct = 'password1'
    incorrect = 'hello'
    assert True == (
        bcrypt.checkpw(
            correct.encode(), 
            cr.get_password(exist).encode()
        )
    )
    assert False == (
        bcrypt.checkpw(
            incorrect.encode(), 
            cr.get_password(exist).encode()
        )
    )
    assert True == ('' == cr.get_password(not_exist))

def test_match_credentials():
    exist = 'test@gmail.com'
    not_exist = 'hello@gmail.com'
    correct = 'password1'
    incorrect = 'hello'
    assert True == cr.match_credentials(exist, correct)
    assert False == cr.match_credentials(exist, incorrect)
    assert False == cr.match_credentials(not_exist, correct)

def test_createAccount():
    new_email = 'hello@gmail.com'
    new_password = 'password2'
    secQ = 'question'
    secA = 'answer'
    cr.createAccount(new_email, new_password,secQ,secA)
    assert True == cr.account_exist(new_email)

def test_removeAccount():
    pytest_setup()
    email = 'test@gmail.com'
    secQ = 'question'
    secA = 'answer'
    wl.insert_watchlist(email,'ANZ')
    tr.buyStock(email,'ANZ',1)
    bt.createBet(email, 'ANZ', 0, 500, 10)

    # Use user_id to check wiped from database
    user_id = tr.getUserId(email)
    cr.removeAccount(email, 'password1', 'password1')
    # Check have been removed from all tables
    tables = ['watchlist','portfolio','betting','bet_history','account']
    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()
    for table in tables:
        sql = 'SELECT * FROM {} WHERE user_id = {}'.format(table,user_id)
        cur.execute(sql)
        res = cur.fetchall()
        assert len(res) == 0
    conn.commit()
    conn.close()

def test_changePassword():
    pytest_setup()
    assert True == cr.match_credentials('test@gmail.com', 'password1')
    cr.changePassword('test@gmail.com', 'password2')
    assert False == cr.match_credentials('test@gmail.com', 'password1')
    assert True == cr.match_credentials('test@gmail.com', 'password2')

def test_getSecurityQ():
    assert 'question' == cr.getSecurityQ('test@gmail.com')
    assert 'notquestion' != cr.getSecurityQ('test@gmail.com')

def test_getSecurityA():
    assert 'answer' != cr.getSecurityA('test@gmail.com')

def test_matchSecurity():
    assert True == cr.matchSecurity('test@gmail.com','answer')
    assert False == cr.matchSecurity('test@gmail.com','notanswer')

def test_exceptions():
    pytest_setup()
    valid_email = 'test@gmail.com'
    invalid_email = 'test'
    valid_password = 'password1'
    invalid_password = 'hello'
    secQ = 'question'
    secA = 'answer'

    with pytest.raises(Exception, match=r"Invalid email"):
        cr.createAccount(invalid_email, valid_password,secQ,secA)
        
    with pytest.raises(Exception, match=r"Invalid password"):
        cr.createAccount(valid_email, invalid_password,secQ,secA)
        
    with pytest.raises(Exception, match=r"Account exists"):
        cr.createAccount(valid_email, valid_password,secQ,secA)
    
    result = cr.removeAccount(invalid_email, invalid_password, invalid_password)
    assert result['passErr'] == 'Account does not exist'
        
    result = cr.removeAccount(valid_email, invalid_password, invalid_password)
    assert result['passErr'] == 'Incorrect password'
        
    result = cr.removeAccount(valid_email, valid_password, invalid_password)
    assert result['passRepErr'] == 'Passwords do not match'
