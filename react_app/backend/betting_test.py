import pytest
import sqlite3
import database as db
import credentials as cr
import trade as tr
import betting as bt
import datetime as dt
from datetime import date, timedelta
import time
import bcrypt
import os

# Setup testdb, first remove existing copies
def pytest_setup():


    if os.path.isfile('testdb.db'):
        os.remove('testdb.db') 
    db.dbPath = os.path.abspath('testdb.db')
    cr.dbPath = os.path.abspath('testdb.db')
    tr.dbPath = os.path.abspath('testdb.db')
    bt.dbPath = os.path.abspath('testdb.db')

    db.initialise()
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    email3 = 'test3@gmail.com'
    email5 = 'test5@gmail.com'
    email6 = 'test6@gmail.com'
    hashed1 = bcrypt.hashpw(b'password1', bcrypt.gensalt()).decode()
    hashed2 = bcrypt.hashpw(b'password2', bcrypt.gensalt()).decode()
    hashed3 = bcrypt.hashpw(b'password3', bcrypt.gensalt()).decode()

    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES (\'{}\', \'{}\', 10000, \'{}\', \'{}\')'.format(email1, hashed1, 'q', 'a')
    cur.execute(sql)
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES (\'{}\', \'{}\', 10000, \'{}\', \'{}\')'.format(email2, hashed2, 'q', 'a')
    cur.execute(sql)
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES (\'{}\', \'{}\', 10000, \'{}\', \'{}\')'.format(email3, hashed3, 'q', 'a')
    cur.execute(sql)
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES (\'{}\', \'{}\', 10000, \'{}\', \'{}\')'.format(email5, hashed3, 'q', 'a')
    cur.execute(sql)
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES (\'{}\', \'{}\', 1, \'{}\', \'{}\')'.format(email6, hashed3, 'q', 'a')
    cur.execute(sql)

    conn.commit()
    conn.close()

    user_id1 = tr.getUserId(email1)
    user_id2 = tr.getUserId(email2)
    user_id3 = tr.getUserId(email3)
    user_id5 = tr.getUserId(email5)

    today = dt.date.today()
    start_date = today + timedelta(days = -10)
    start_date2 = today + timedelta(days = -20)
    start_date3 = today + timedelta(days = -2)
    start_date = time.mktime(start_date.timetuple())
    start_date2 = time.mktime(start_date2.timetuple())
    start_date3 = time.mktime(start_date3.timetuple())


    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()
    sql = 'INSERT INTO betting (user_id, company_id, bet_amount, growth, start_price, start_date, multiplier) VALUES (\'{}\', 115, 10, 1, 0, \'{}\', 10)'.format(user_id1, start_date)
    cur.execute(sql)

    sql = 'INSERT INTO betting (user_id, company_id, bet_amount, growth, start_price, start_date, multiplier) VALUES (\'{}\', 115, 10, 0, 0, \'{}\', 10)'.format(user_id2, start_date2)
    cur.execute(sql)

    sql = 'INSERT INTO betting (user_id, company_id, bet_amount, growth, start_price, start_date, multiplier) VALUES (\'{}\', 115, 10, 0, 0, \'{}\', 10)'.format(user_id5, start_date3)
    cur.execute(sql)

    conn.commit()
    conn.close()

pytest_setup()

def test_checkBet():
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    user_id1 = tr.getUserId(email1)
    user_id2 = tr.getUserId(email2)
    user_id3 = 9999
    assert True == bt.checkBet(user_id1)
    assert True == bt.checkBet(user_id2)
    assert False == bt.checkBet(user_id3)

def test_createBet():
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    email3 = 'test3@gmail.com'
    email4 = 'test4@gmail.com'
    email6 = 'test6@gmail.com'
    valid = 'CBA'
    invalid = '111'
    user_id3 = tr.getUserId(email3)

    with pytest.raises(Exception, match=r"Email doesn't exist"):
        bt.createBet(email4, valid, 0, 100, 2)
    with pytest.raises(Exception, match=r"Invalid company code"):
        bt.createBet(email3, invalid, 0, 100, 2)
    with pytest.raises(Exception, match=r"User has an existing bet running"):
        bt.createBet(email1, valid, 0, 100, 2)
    with pytest.raises(Exception, match=r"Not Enough Capital to Start Bet, You don't have enough capital to pay out if you lose"):
        bt.createBet(email6, valid, 0, 100, 2)
    with pytest.raises(Exception, match=r"Cannot have empty bet amount"):
        bt.createBet(email6, valid, 0, 0, 2)
    with pytest.raises(Exception, match=r"Cannot have a negative bet amount"):
        bt.createBet(email6, valid, 0, -5, 2)
    with pytest.raises(Exception, match=r"Cannot have empty bet amount"):
        bt.createBet(email6, valid, 0, None , 2)


    bt.createBet(email3, valid, 0, 100, 2)
    assert True == bt.checkBet(user_id3)

def test_deleteBet():
    email3 = 'test3@gmail.com'
    email4 = 'test4@gmail.com'
    user_id3 = tr.getUserId(email3)

    with pytest.raises(Exception, match=r"Email doesn't exist"):
        bt.deleteBet(email4)

    bt.deleteBet(email3)
    assert False == bt.checkBet(user_id3)

    with pytest.raises(Exception, match=r"User does not have a bet"):
        bt.deleteBet(email3)

def test_checkWinLose():
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    email5 = 'test5@gmail.com'

    # Assumes that user has a bet
    # check for a win, return 1
    assert(bt.checkWinLose(email1) == 1)

    # check for a loss, return 0
    assert(bt.checkWinLose(email2) == 0)

    # check for a unended bet, return -1
    assert(bt.checkWinLose(email5) == -1)

def test_createBetHistory():
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    email3 = 'test3@gmail.com'
    email4 = 'test4@gmail.com'
    valid = 'CBA'
    invalid = '111'
    user_id3 = tr.getUserId(email3)

    with pytest.raises(Exception, match=r"Email doesn't exist"):
        bt.createBetHistory(email4)

    assert(bt.createBetHistory(email1))
    
def test_caculateReward(): 
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    email5 = 'test5@gmail.com'

    assert(bt.calculateReward(email1) == 110)
    assert(bt.calculateReward(email2) == -200)
    assert(bt.calculateReward(email5) == 0)

def test_createBetHistory():
    pytest_setup()
    email1 = 'test@gmail.com'
    email5 = 'test5@gmail.com'
    user_id5 = tr.getUserId(email5)
    user_id1 = tr.getUserId(email1)
    # Call the create bet function for user3
    # Check a betting that hasn't finished

    #Create a bet that has finished
    # today = dt.date.today()
    # start_date = today + timedelta(days = -10)
    # start_date = time.mktime(start_date.timetuple())
    # conn = sqlite3.connect('testdb.db')
    # cur = conn.cursor()
    # sql = 'INSERT INTO betting (user_id, company_id, bet_amount, growth, start_price, start_date, multiplier) VALUES (\'{}\', 115, 10, 1, 0, \'{}\', 10)'.format(user_id3, start_date)
    # cur.execute(sql)
    # conn.commit()
    # conn.close()

    # Create a bet_history record that has finished: email1
    bt.createBetHistory(email1)
    # Create a bet_history record that hasn't finished: email5
    bt.createBetHistory(email5)

    #Check both of the bet histories
    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()
    sql = 'SELECT Bet_id, user_id, company_id, bet_amount, growth, reward, status FROM bet_history WHERE user_id = ' + str(user_id1)
    cur.execute(sql)
    res1 = cur.fetchall()
    sql = 'SELECT Bet_id, user_id, company_id, bet_amount, growth, reward, status FROM bet_history WHERE user_id = ' + str(user_id5)
    cur.execute(sql)
    res2 = cur.fetchall()
    assert(res1 == [(1, 1, 115, 10.0, 1, 110.0, 'active')])
    assert(res2 == [(2, 4, 115, 10.0, 0, 0.0, 'active')])
    conn.close()

def test_updateBetHistory():
    email5 = 'test5@gmail.com'
    user_id5 = tr.getUserId(email5)
    # update email5's bet_history record, it should still be active, updateBetHistory should return false
    assert(bt.updateBetHistory(email5) == False)
    # Directly change the unix time to 10 days ago, 
    today = dt.date.today()
    end_date = today + timedelta(days = -10)
    end_date = time.mktime(end_date.timetuple())
    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()
    sql = 'UPDATE bet_history SET end_date = \'{}\' WHERE user_id = {} AND status = \'{}\''.format(end_date, user_id5, "active")
    cur.execute(sql)
    conn.commit()
    conn.close()

    # Call updateBetHistory, it should be updated, changing active status to finished

    assert(bt.updateBetHistory(email5) == True)
    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()
    sql = 'SELECT  status FROM bet_history WHERE user_id = ' + str(user_id5)
    cur.execute(sql)
    res1 = cur.fetchall()
    conn.close()
    assert(res1 == [('finished',)])
    
    # Check a user has no active bet running and it is deleted from betting table
    assert(bt.updateBetHistory(email5) == False)
    assert(bt.checkBet(user_id5) == False)
    