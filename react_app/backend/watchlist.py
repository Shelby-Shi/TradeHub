import sqlite3
import re
import os 
import credentials
import datetime as dt
from datetime import date, timedelta, datetime

path = os.getcwd()
path = path[:path.index("react_app")] + 'react_app/'
dbPath = path + 'backend/users.db'
csvPath = path + 'backend/company_list.csv'

# Return user_id from account table
def get_user_id(cursor,email):
    sql = 'SELECT user_id from account where email=\'{}\''.format(email)
    cursor.execute(sql)
    res = cursor.fetchall()
    if len(res) == 1:
        return res[0][0]

# Return company_id from company_code table
def get_company_id(cursor,CompanyCode):
    sql = 'SELECT company_id from company_code where code=\'{}\''.format(CompanyCode)
    cursor.execute(sql)
    res = cursor.fetchall()
    if len(res) == 1:
        return res[0][0]

# Return start_date 
def get_watch_start(user, comp_id):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT start_date from watchlist where user_id = {} and company_id = {}'.format(user, comp_id)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    return result[0][0]

# Check if an account is watching a stock code
# return false/true. 
# Note if somehow an account has two instances of watching a stock, returns true.
def email_watch_stock(email, stock):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    user_id = get_user_id(cur,email)
    company_id = get_company_id(cur,stock)
    sql = "SELECT * FROM watchlist WHERE user_id=\'{}\' and company_id=\'{}\'".format(user_id,company_id)
    cur.execute(sql)
    res = cur.fetchall()
    conn.close()
    if len(res) == 0:
        return False
    else:
        return True

# Input: email stock_code
# If is not in user' watchlist,then it will add to watchlist
# adds a timestamp for the watchlist. 
# the timestamp is set to the start of the day it was added
# Checks that email exists in accounts table
# Without checking valid stock code 
def insert_watchlist(email,stock):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    success = False
    user_id = get_user_id(cur,email)
    company_id = get_company_id(cur,stock)
    sql = "SELECT * FROM watchlist WHERE user_id=\'{}\' and company_id=\'{}\'".format(user_id,company_id)
    cur.execute(sql)
    res = cur.fetchall()
    if ((len(res) == 0) and (credentials.account_exist(email))):
        start_date = dt.datetime.today()
        start_date = start_date.replace(hour=0, minute=0, second=0)
        timestamp = datetime.timestamp(start_date)
        sql = 'INSERT INTO watchlist (user_id, company_id, start_date) VALUES (\'{}\', \'{}\', \'{}\')'.format(user_id, company_id, timestamp)
        cur.execute(sql)
        conn.commit()
        success = True
    conn.close()
    return success

# Input: email stock_code
# Delete a stock from watchlist based on stock code.
# returns true/false on success.
def delete_watchlist(email,stock):
    success = False
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    user_id = get_user_id(cur,email)
    company_id = get_company_id(cur,stock)
    sql = "SELECT * FROM watchlist WHERE user_id=\'{}\' and company_id=\'{}\'".format(user_id,company_id)
    cur.execute(sql)
    res = cur.fetchall()
    #should be only one record
    if (len(res) == 1):
        sql = "DELETE FROM watchlist WHERE user_id=\'{}\' and company_id=\'{}\'".format(user_id, company_id)
        cur.execute(sql)
        conn.commit()
        success = True
    conn.close()
    return success

#Input: email
#Return all stock codes associated with an email. returns empt [] when no results.
def return_watchlist(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    user_id = get_user_id(cur, email)
    sql = "SELECT company_id FROM watchlist WHERE user_id=\'{}\'".format(user_id)
    cur.execute(sql)
    res = cur.fetchall()
    result = []
    for i in res:
        cur.execute('SELECT code from company_code where company_id=\'{}\''.format(i[0]))
        temp = cur.fetchall()
        if len(temp) == 1:
            result.append(temp[0][0])
    conn.close()
    return result
