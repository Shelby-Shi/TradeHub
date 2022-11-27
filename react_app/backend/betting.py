import sqlite3
import re
import database as db
import api
import datetime as dt
from datetime import date, timedelta
import time
import trade as tr
import credentials as cr

import os 
path = os.getcwd()
path = path[:path.index("react_app")] + 'react_app/'
# Deploy path
dbPath = path + 'backend/users.db'

# Checks if user has an active bet running.
# Returns true/false if there is/isn't a bet
def checkBet(user_id):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()

    sql = "SELECT user_id FROM betting WHERE user_id = {}".format(user_id)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()

    if(len(result) == 0):
        return False 
    return True

# Creates a new bet for a user, given the email, stock code,
# whether the stock will increase/decrease, bet amount and reward multiplier
# returns true on a sucess and raises exceptions otherwise.
def createBet(email, code, growth, bet_amount, reward_mult):
    #code = code.lower + ".ax"
    # Checks if bet_amount is null
    if(bet_amount == None or bet_amount == 0):
        raise Exception('Cannot have empty bet amount')

    # Checks if bet_amount is negative
    if(bet_amount < 0):
        raise Exception('Cannot have a negative bet amount')
    
    # Check if email provided is valid and exists:
    if(cr.account_exist(email) == False):
        raise Exception('Email doesn\'t exist')

    # Check company code is valid
    if tr.valid_code(code) == False:
        raise Exception('Invalid company code')

    # Check if user has enough capital
    user_capital = tr.getCapital(email)
    if user_capital < (bet_amount * reward_mult * 2):
        raise Exception('Not Enough Capital to Start Bet, You don\'t have enough capital to pay out if you lose ')


    user_id = tr.getUserId(email)
    company_id = tr.getCompanyId(code)

    unix_time = time.time()
    curr_price = api.stock_current_price(code)

    # 0 = indicates stock price will go down, 1 = indicates stock price will go up
    # Function to ensure user has only 1 active bet going on
    if checkBet(user_id) == True:
        raise Exception('User has an existing bet running')

    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'INSERT INTO betting (user_id, company_id, bet_amount, growth, start_price, start_date, multiplier) ' + \
        'VALUES ({}, {}, {}, {}, {}, {} ,{})'.format(user_id, company_id, bet_amount, growth, curr_price, unix_time, reward_mult)  
    cur.execute(sql)

    conn.commit()
    conn.close()

    #Update user's capital
    new_capital = tr.getCapital(email) - bet_amount
    tr.setCapital(email, new_capital)

    #Create an active bet_history
    createBetHistory(email)
    return True

# Function to remove user's bet from the database, given an email
def deleteBet(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()

    # Check if email provided is valid
    if(cr.account_exist(email) == False):
        raise Exception('Email doesn\'t exist')

    user_id = tr.getUserId(email)

    # Checks if user has an existing bet running
    if(checkBet(user_id) == False):
        raise Exception('User does not have a bet')

    sql = 'DELETE FROM betting WHERE user_id = {}'.format(user_id)

    cur.execute(sql)
    conn.commit()
    conn.close()

# Functions to check user win or lose, 1 for win, 0 for lose, -1 for not ended
def checkWinLose(email):
    user_id = tr.getUserId(email)
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    # Grab data for user's bet
    sql = 'SELECT company_id, growth, start_price, start_date FROM betting WHERE user_id = {}'.format(user_id)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()

    company_id = result[0][0]
    growth = result[0][1]
    start_price = result[0][2]
    start_date = result[0][3]
    company_code = tr.getCompanyCode(company_id)
    # get the end date
    start_date = dt.datetime.fromtimestamp(start_date).strftime('%Y-%m-%d')
    start = dt.datetime.strptime(start_date, "%Y-%m-%d")
    end = start + timedelta(days = 8)
    end_date = dt.datetime.strftime(end, "%Y-%m-%d")
    # haven't end
    if (end >= dt.datetime.today()):
        return -1

    end_price = api.stock_close_price_for_date(company_code, end_date)

    if (growth == 1):
        if (end_price > start_price):
            return 1
        else:
            return 0
    if (growth == 0):
        if (end_price < start_price):
            return 1
        else:
            return 0

# Creates a new bet history for a user given an email
# returns true on a success
def createBetHistory(email):
    # Check if email provided is valid and exists:
    if(cr.account_exist(email) == False):
        raise Exception('Email doesn\'t exist')

    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()

    user_id = tr.getUserId(email)

    # Fetch user bet details to insert into bet_history
    sql = 'SELECT user_id, company_id, bet_amount, growth, start_date FROM betting WHERE user_id = {}'.format(user_id)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()

    user_id = result[0][0]
    company_id = result[0][1]
    bet_amount = result[0][2]
    growth = result[0][3]
    start_date = result[0][4]

    # Calculate the end date
    start_date = dt.datetime.fromtimestamp(start_date).strftime('%Y-%m-%d')
    start = dt.datetime.strptime(start_date, "%Y-%m-%d")
    end = start + timedelta(days = 7)
    end_unix = time.mktime(end.timetuple())

    reward = calculateReward(email)
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'INSERT INTO bet_history (user_id, company_id, bet_amount, growth, end_date, reward, status) ' + \
        'VALUES ({}, {}, {}, {}, {}, {}, \'{}\')'.format(user_id, company_id, bet_amount, growth, end_unix, reward, "active")  

    cur.execute(sql)
    conn.commit()
    conn.close()

    # Deletes old bet history
    deleteBetHistory(email)

    return True


# Updates Bet History by checking if the bet has finished yet, or not
def updateBetHistory(email):

    # Check if email provided is valid and exists:
    if(cr.account_exist(email) == False):
        raise Exception('Email doesn\'t exist')

    uid = tr.getUserId(email)

    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()

    sql = 'SELECT status, end_date FROM bet_history WHERE user_id = {} and status = \'{}\''.format(uid, "active")
    cur.execute(sql)
    result = cur.fetchall()
    conn.commit()
    conn.close()

    # Checks if user does not have an active bet running, if there is no active bet running there
    # is no need to update therefore return False

    if(len(result) == 0):
        return False

    curr_date = dt.datetime.now()
    curr_unix = time.mktime(curr_date.timetuple())
    end_unix = result[0][1]

    # Checks if current date is lesser than the end date, if so it indicates
    # we haven't reached the end date to update therefore we can return and we don't need to update
    if(curr_unix < end_unix):
        return False 

    # Else if we satisfy the update conditions, calculate the reward/loss
    # Update the bet_history table and user capital
    reward = calculateReward(email)

    # Delete active bet from betting table, do this last because calculateReward() needs to fetch some data from the betting table
    # before deletion
    deleteBet(email)

    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'UPDATE bet_history SET status = \'{}\', reward = {} WHERE user_id = {} AND status = \'{}\''.format("finished", reward, uid, "active")

    cur.execute(sql)
    conn.commit()
    conn.close()

    # Update user capital based on the rewards earned
    currCapital = tr.getCapital(email)
    updatedCapital = currCapital + reward
    tr.setCapital(email, updatedCapital)
    return True


# Delete Bet History, It will Always Remove the Oldest and Inactive Bet History 
def deleteBetHistory(email):
    # Check if email provided is valid and exists:
    if(cr.account_exist(email) == False):
        raise Exception('Email doesn\'t exist')

    uid = tr.getUserId(email)

    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()

    # Checks for Old Betting History
    sql = 'SELECT COUNT(*) FROM bet_history WHERE user_id = {}'.format(uid)
    cur.execute(sql)
    result = cur.fetchall()

    # If we have 3 or less betting history to user, don't need to remove any
    if(result[0][0] <= 3):
        return True 

    # Find oldest bet history and remove it
    sql = 'SELECT MIN(end_date) FROM bet_history WHERE user_id = {} and status = \'{}\''.format(uid, "finished")
    cur.execute(sql)
    result = cur.fetchall()
    min_date = result[0][0]

    sql = 'DELETE FROM bet_history WHERE user_id = {} and status = \'{}\' and end_date = {}'.format(uid, "finished", min_date)
    cur.execute(sql)
    conn.commit()
    conn.close()
    return True


# Given a user's email, returns an array of each bet_history record.
def getBetHistory(email):
    uid = tr.getUserId(email)
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()

    sql = 'SELECT bet_id, company_id, bet_amount, reward, status FROM bet_history WHERE user_id = {} ORDER BY status ASC'.format(uid)
    cur.execute(sql)
    result = cur.fetchall()
    conn.commit()
    conn.close()
    
    i = 1
    out = []
    for x in result:
        new_dict = {
            "key": "bet_hist_key" + str(i),
            "id": i,
            "bet_id": x[0],
            "code": tr.getCompanyCode(x[1]),
            "amount": x[2],
            "reward": x[3], 
            "status": x[4]
        }
        out.append(new_dict)
        i += 1
    
    return out


# Caculate the reward amount for a user's bet
# If the bet hasn't finished yet, returns 0
def calculateReward(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    user_id = tr.getUserId(email)

    sql = 'SELECT bet_amount, multiplier FROM betting WHERE user_id = {}'.format(user_id)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()

    bet_amount = result[0][0]
    multiplier = result[0][1]
    status = checkWinLose(email)
    # Using the status of the bet, determine the reward value and return it
    # If bet is ongoing, the reward value is still 0
    if (status == 1):
        return bet_amount * (multiplier + 1)
    if (status == 0):
        return -1 * bet_amount * multiplier * 2
    return 0




