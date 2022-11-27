import os
import sys
import sqlite3
import pytest
import watchlist as wl
import database as db
import credentials as cr

# Setup testdb, first remove existing copies
def pytest_setup():
    if os.path.isfile(os.path.abspath('testdb.db')):
        os.remove(os.path.abspath('testdb.db'))
    db.dbPath = os.path.abspath('testdb.db')
    cr.dbPath = os.path.abspath('testdb.db')
    wl.dbPath = os.path.abspath('testdb.db')

    db.initialise()
    
    # Add initialisation data for testing purposes
    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()
    # add a stock to watchlist
    # user_id: 1 test@gamil.com
    # company_id: 436 DGR
    secQ = 'question'
    secA = 'answer'
    sql = 'INSERT INTO account (email, password, capital,secQ,secA) VALUES (\'{}\', \'{}\', + \
    1000000000,\'{}\',\'{}\')'.format('test@gmail.com', 'password1',secQ,secA)
    cur.execute(sql)
    sql = 'INSERT INTO watchlist (user_id, company_id, start_date) VALUES (\'{}\', \'{}\', \'{}\')'.format(1,396, 1605163487)
    cur.execute(sql)
    conn.commit()
    conn.close()

# Run pytest_setup once at start of tests
pytest_setup()

def test_insert_watchlist():
    email = 'test@gmail.com'
    email_not_exist = 'fake@gmail.com'
    exist = 'DGR'
    not_exist = 'ABA'
    wl.insert_watchlist(email,exist)    
        
    conn = sqlite3.connect(wl.dbPath)
    sql = 'SELECT * FROM watchlist'
    cur = conn.cursor()
    
    #Already in the database
    cur.execute(sql)
    res = cur.fetchall()
    
    assert 1 == len(res)
    #should be successfully inserted
    wl.insert_watchlist(email,not_exist)    
    cur.execute(sql)
    conn.commit()
    res = cur.fetchall()
    assert 2 == len(res)

    # try to insert again, this should fail
    wl.insert_watchlist(email,not_exist)
    cur.execute(sql)
    conn.commit()

    res = cur.fetchall()
    assert 2 == len(res)

    # Inserting an email that doesn't exist in the accounts table should fail
    wl.insert_watchlist(email_not_exist, not_exist)
    cur.execute(sql)
    conn.commit()
    
    res = cur.fetchall()
    assert 2 == len(res)
    conn.close()
    
def test_delete_watchlist():
    email = 'test@gmail.com'
    exist = 'DGR'
    not_exist = 'ABC'
    sql = 'SELECT * from watchlist'
    wl.delete_watchlist(email,not_exist)
    conn = sqlite3.connect(wl.dbPath)
    cur = conn.cursor()
    
    #Already in the database
    cur.execute(sql)
    res = cur.fetchall()
    assert 2 == len(res)

    #delete from table should be success
    wl.delete_watchlist(email,exist)
    cur.execute(sql)
    res = cur.fetchall()
    assert 1 == len(res)

    #duplicated deleteion should be fail
    wl.delete_watchlist(email,exist)
    cur.execute(sql)
    res = cur.fetchall()
    assert 1 == len(res)

# This relies on test@gmail.com watching DGR and ABA stocks
def test_email_watch_stock():
    email = 'test@gmail.com'
    email_not_exist = 'fake@gmail.com'
    wl.insert_watchlist(email,'DGR')
    # Account has first and second stock but not third
    # The third stock code is invalid
    assert(wl.email_watch_stock(email, 'ABA') == True)
    assert(wl.email_watch_stock(email, 'DGR')== True)
    assert(wl.email_watch_stock(email, '123') == False)
    # This should all fail, as the email isn't watching any stocks
    assert(wl.email_watch_stock(email_not_exist, 'CIM') == False)
    assert(wl.email_watch_stock(email_not_exist, 'ABA') == False)
    assert(wl.email_watch_stock(email_not_exist, 'DGR') == False)


# testing the return watchlist function. 
# This relies on test@gmail.com  watching CIM and ABA stocks
def test_return_watchlist():
    email_1 = 'test1@gmail.com'
    email_2 = 'test2@gmail.com'
    pass_2 = 'password1'
    email_3 = 'fake@gmail.com'
    secQ = 'question'
    secA = 'answer' 
    stock_1 = 'CIM'
    stock_2 = 'ABA'
    stock_3 = 'DGR'

    # Setting up a bigger DB: add another account, and give it one stock to watch
    cr.createAccount(email_2, pass_2,secQ,secA)
    assert(cr.account_exist(email_2))
    wl.insert_watchlist(email_2, stock_3)
    assert(wl.email_watch_stock(email_2, stock_3))

    # Now actually test the return function
    # the first email should have exactly zero stocks
    res = wl.return_watchlist(email_1)
    assert(len(res) == 0)

    # the second email should have exactly one stock
    res = wl.return_watchlist(email_2)
    assert(len(res) == 1)
    assert(res[0] == 'DGR')

    #len of watchlist should be three
    wl.insert_watchlist(email_2,stock_1)
    wl.insert_watchlist(email_2,stock_2)
    res = wl.return_watchlist(email_2)
    assert(len(res) == 3)

    # the invalid email should have no stocks
    res = wl.return_watchlist(email_3)
    assert(len(res) == 0)
