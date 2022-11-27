import pandas as pd
import yfinance as yf
import numpy as np  
import requests
import json
import datetime as dt
import trade as tr
import watchlist as wr
import csv
import sqlite3
import datetime
from datetime import date, timedelta

import os 
path = os.getcwd()
path = path[:path.index("react_app")] + 'react_app/'
dbPath = path + 'backend/users.db'
listPath = path + 'backend/company_list.csv'

# Given a string, return the matching list of company names and stock codes
# if the company name or stock code contains the query, return that pair.
# Company name/stockcode is stored as key/value pair in a dict
# function returns a json dump of dict, return emptydict if search fails
def search(searchQuery):
    # To ensure case insensitivity, lower all strings
    searchQuery = searchQuery.lower()
    data = []
    results = []
    i = 0
    limit = 10

    # Read the csv file to data buffer to work on
    with open(listPath) as csvfile:
        reader = csv.reader(csvfile)
        for row in reader:
            data.append(row)
        for row in data:
            if(i >= limit):
                break
            if ((searchQuery in (row[0].lower())) or (searchQuery in (row[1].lower()))):
                info = stock_generic(row[1].lower())
                obj = {
                    "id": i+1,
                    "name": row[0],
                    "code": row[1],
                    "change": info[0],
                    "close": info[1],
                    "key": row[1] + "_key"
                }
                results.append(obj)
                i = i + 1
    return results


# check if the stock code exist
def checkExist(name):
    df = pd.read_csv(listPath, header=None)
    # take the second column of the dataframe
    test = df[1]
    for x in test:
        if x.lower() == name.lower():
            return True 
    string = "Stock Code: " + name + " is invalid"
    raise ValueError(string)

# check if the dates chosen valid or not
def dateCheck(start, end): 
    try:
        start = dt.datetime.strptime(start, "%Y-%m-%d")
        end = dt.datetime.strptime(end, "%Y-%m-%d")
    except:
        raise ValueError("Invalid date string!")
    if(start >= end):
        raise ValueError("Start date cannot be >= end date")
    return True

# return latest stock market capitalization
# helper for stock_last
def stock_market_cap(stock):
    stock_market_cap = stock.info['marketCap']
    return stock_market_cap

# return stock market shares
# helper for stock_last
def stock_number_of_shares(stock):
    num_of_shares = stock.info['sharesOutstanding']
    return num_of_shares
    
# return latest stock close price
# helper for stock_last
def stock_current_price_last(stock_prices):
    return float(stock_prices.Close.iloc[-1:].iloc[0])

# return latest day's stock total volume
# helper for stock_last
def stock_current_volume(stock_volume):
    return int(stock_volume.Volume.iloc[-1:].iloc[0])

# return stock annual percent yield
# compare to one year ago
# helper for stock_last
def stock_annual_yield(stock_historical):
    latest = float(stock_historical.Close.iloc[-1:].iloc[0])
    last_year = float(stock_historical.Close.iloc[0])
    annual_yield = latest/last_year - 1
    return annual_yield

# return stock's daily percentage change
# helper for stock_last
def stock_daily_percentage(stock_historical):
    latest = float(stock_historical.Close.iloc[-1:].iloc[0])
    day_before = float(stock_historical.Close.iloc[-2:].iloc[0])
    daily_percentage = latest/day_before - 1
    return daily_percentage

# return latest stock's Overview for the stock details page
def stock_last(name):
    name = name + ".ax"
    stock = yf.Ticker(name.lower())
    # retrieve one year's worth of data from today
    stock_historical = stock.history(period="1y", interval="1d")

    # checks to remove any cell with NaN value
    stock_historical = stock_historical.dropna(how="any")

    stock_historical = pd.DataFrame(stock_historical)
    # call helper funtions
    market_cap = stock_market_cap(stock)
    current_price = round(stock_current_price_last(stock_historical), 4)
    current_volume = stock_current_volume(stock_historical)
    number_of_shares = stock_number_of_shares(stock)
    annual_yield = round(stock_annual_yield(stock_historical) * 100, 2)
    daily_percentage = round(stock_daily_percentage(stock_historical) * 100, 2)
    # dump into dictionary and format data
    dict = {'cap': market_cap, 'price': current_price, 'vol': current_volume,
     'numSh': number_of_shares, 'annual': annual_yield, 'daily': daily_percentage}
    
    return json.dumps(dict)

# return last five working days' price details
def stock_last_week(name):
    name = name + ".ax"
    stock = yf.Ticker(name.lower())
    new_list = []

    # retrieve one month's worth of data from today
    stock_historical = stock.history(period="1mo", interval="1d")

    stock_historical = pd.DataFrame(stock_historical)
    stock_historical = stock_historical.dropna(how="any")

    # return if there's no stock data
    if(len(stock_historical.index) == 1):
        new_obj = {
            "key": "histEmpty",
            "date": "No Historical Data Available",
            "open": "N/A",
            "high": "N/A",
            "low": "N/A",
            "price": "N/A",
            "daily": "N/A",
            "volume": "N/A"
        }
        new_list.append(new_obj)
        return new_list

    # Get past 5 valid dates, date is stored in increasing order so the 
    # latest date starts from the last index
    curr_list = stock_historical.index.values
    curr_list = curr_list[-5:]
    date_list = []

    for x in curr_list:
        currDate = str(x)
        currDate = currDate[0:10]
        currDate = dt.datetime.strptime(currDate, "%Y-%m-%d")
        currDate = currDate.strftime("%d-%m")
        date_list.append(currDate)
    # there are stock code exist without dividends and stock splits
    del stock_historical['Dividends']
    del stock_historical['Stock Splits']
   
    # change columns name
    stock_historical.rename(columns = {'Close': 'price'}, inplace = True)
    # change columns name to lowercase
    stock_historical.columns = map(str.lower, stock_historical.columns)
    # change index name
    stock_historical['daily'] = 1.0000
    stock_historical = stock_historical.iloc[-5:]

    # Daily Changes calculation
    i = 4
    while i >= 1 :
        stock_historical.iloc[i, 5] = \
        round((stock_historical.iloc[i, 3] / stock_historical.iloc[i - 1, 3] - 1) * 100, 4)
        i = i -1

    # Rounds all values in dataframe to two decimal places
    for i in range(0, 5):
        for j in range(0, 6):
            stock_historical.iloc[i, j] = round(stock_historical.iloc[i, j], 4)
    
    for i in range(4, -1, -1):
        new_obj = {
            "key": "hist" + str(i),
            "date": date_list[i],
            "open": float(stock_historical["open"][i]),
            "high": float(stock_historical["high"][i]),
            "low": float(stock_historical["low"][i]),
            "price": float(stock_historical["price"][i]),
            "daily": round(float(stock_historical["daily"][i]), 2),
            "volume": int(stock_historical["volume"][i])
        }
        new_list.append(new_obj)
    return new_list

# return generic stock informations such as 5 day changes and latest closing price
def stock_generic(code):
    name = code + ".ax"
    stock = yf.Ticker(name.lower())

    stock_history = stock.history(period="1mo", interval="1d")

    stock_history = pd.DataFrame(stock_history)
    latest = None
    prev5 = None

    # For the case when there are no details
    if(stock_history.empty == True):
        return [0,0]

    # For the case when stock only has 1 detail
    if(len(stock_history.index) == 1 and stock_history.empty == False):
        return [0, round(stock_history['Close'][0], 4)]
    elif(len(stock_history.index) == 2):
        latest = stock_history.iloc[1]
        prev5 = stock_history.iloc[0]
    elif(len(stock_history.index) > 2 and len(stock_history.index) < 5):
        latest = stock_history.iloc[-1:]
        prev5 = stock_history.iloc[0:1]
    else:
        latest = stock_history.iloc[-1:]
        prev5 = stock_history.iloc[-5:-4]

    change = (latest['Close'][0] / prev5['Close'][0] - 1) * 100
    return [round(change, 2), round(latest['Close'][0], 4)]

# FUNCTION for trade.py
# return stock's latest close price by fetching hisory for last whole week
# and return the close price of the last line
def stock_current_price(name):
    name = name + ".ax"
    stock = yf.Ticker(name.lower())
    stock_historical = stock.history(period="1w", interval="1d")
    return round(float(stock_historical.Close.iloc[-1:].iloc[0]), 4)

# get the close_price_for_the_date
# return the close price of the last line
def stock_close_price_for_date(name, start_date):
    checkExist(name)
    # get the data one day after
    start = dt.datetime.strptime(start_date, "%Y-%m-%d")
    end_date = start
    end_date = dt.datetime.strftime(end_date, "%Y-%m-%d")
    start = start + timedelta(days = -1)
    start_date = dt.datetime.strftime(start, "%Y-%m-%d")
    dateCheck(start_date, end_date)

    name = name + ".ax"
    stock = yf.Ticker(name.lower())
    stock_historical = stock.history(start=start_date, end=end_date, interval="1d")
    # if no valid data get, get the latest valid data
    if (stock_historical.empty == True):
        start = dt.datetime.strptime(start_date, "%Y-%m-%d")
        start = start + timedelta(days = -3)
        start_date = dt.datetime.strftime(start, "%Y-%m-%d")
        stock_historical = stock.history(start=start_date, end=end_date, interval="1d")
    return round(float(stock_historical.Close.iloc[-1:].iloc[0]), 4)

# Retrieve data for watchlist
# Return a dict that contains closing price and percentage of change
def retrieve_stock_base_info(code):
    # To ensure case insensitivity, lower all strings
    results = []
    i = 0
    info = stock_generic(code.lower())
    # if stock doesn't have any data but user still put them in the watchlist
    # for change price and close
    obj = {
        "change": info[0],
        "close": info[1],
        "key": code + "_key",
        "name": tr.getCompanyName(code)
    }
    return obj


# Retrieves a list of stock with a limit of 10 stocks with a given search term
def retrieveCompanyList(search):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    newList = []
    word = 'A' if (search == '') else search

    sql = 'SELECT code, name FROM company_code WHERE code LIKE \'%{}%\' OR name LIKE \'%{}%\' LIMIT 10'.format(word, word)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()

    i = 1
    for x in result:
        new_dict = {
            "key": "bet_" + str(i),
            "id": i,
            "code": x[0],
            "name": x[1]
        }
        newList.append(new_dict)
        i += 1
    
    return newList
 
 # return latest stock market day informations
 # function for graph
def stock_live_market(name):
    checkExist(name)
    name = name + ".ax"
    stock = yf.Ticker(name.lower())
    stock_historical = stock.history(period="1d", interval="1m")
    result = stock_historical.to_json(orient = "index")
    parsed = json.loads(result)
    return parsed

 # return daily information since one week before the user added to watchlist
 # function for watchlist_graph
def stock_watchlist_graph(name, user):
    checkExist(name)
    userid = tr.getUserId(user)
    company_id = tr.getCompanyId(name)
    start = wr.get_watch_start(userid, company_id)
    result = None

    # Prepare stock code with .ax
    code = name + ".ax"
    stock = yf.Ticker(code.lower())

    #Convert Unix timestamp to datetime
    start = datetime.datetime.fromtimestamp(start)
    start = start - timedelta(days=7)
    start_date = datetime.datetime.strftime(start, "%Y-%m-%d")

    currDate = datetime.datetime.now()
    currDate = currDate + timedelta(days=1)
    currDate = datetime.datetime.strftime(currDate, "%Y-%m-%d")
    stock_hist = stock.history(start=start_date, end=currDate, interval="1d")
    result = stock_hist.to_json(orient = "index")
    parsed = json.loads(result)
    return parsed

# yfinance API legend
# 1m = 7 days
# 2m, 5m, 15m, 30m = 60 days
# 1h/60m = 730 days
# 90m = 60 days
# 1d, 5d, 1wk, 1mo, 3mo, 1y or greater = no limit

