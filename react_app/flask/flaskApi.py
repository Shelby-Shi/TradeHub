import sys, os, json
import datetime as dt
from datetime import date, timedelta 
import pandas as pd
from flask import Flask , request, jsonify, make_response
from flask_cors import CORS, cross_origin

path = os.getcwd()[:-5]
path = path + "backend"
sys.path.insert(1, path)

import yfinance as yf
import api
import credentials as cr
import database as db
import trade as tr
import watchlist as wl
import advisor as ad
import betting as bt

app = Flask(__name__)
CORS(app)

# Initialise database if doesn't exist
# Check occurs before every request
@app.before_request
def before_request_func():
    db.initialise()

# Check that register info is valid before adding to database
@app.route('/registerCheck', methods=['POST'])
def checkRegistration():
    data = request.json
    res = {
        "emailRes": False,
        "passRes": False,
        "passRepeatRes": False,
        "exist": True,
        "allowReg": False,
        "capital": 0,
        "securityQError": True,
        "securityAError": True
    }

    # Check if email is valid
    if(cr.valid_email(data['email'])):
        res["emailRes"] = True 
    
    # Check if password is valid
    if(cr.valid_password(data['pass'])):
        res["passRes"] = True 
    
    # Check if both passwords match
    if(data['pass'] == data['pass_repeat']):
        res["passRepeatRes"] = True

    # Check whether account exists already
    if(cr.account_exist(data['email']) == False):
        res["exist"] = False

    # Check that there is a security question
    if(len(data["securityQ"]) != 0):
        res["securityQError"] = False

    # Check that there is a security answer.
    if(len(data["securityA"]) != 0):
        res["securityAError"] = False
       
    # Only allow registration if email and password meets the criteria and the account does not exist yet
    if(res["emailRes"] == True and res["passRes"] == True and res["passRepeatRes"] == \
        True and res["exist"] == False and not (res["securityQError"]) and not (res["securityAError"])):
        res["allowReg"] = True 

    # Add account to database
    if(res["allowReg"]):
        cr.createAccount(data['email'], data['pass'], data['securityQ'], data['securityA'])
        res["capital"] = tr.getCapital(data['email'])

    return jsonify(res)


@app.route('/detailGrab', methods=['POST'])
def grabDetail():
    code = request.json
    out = {
        "cap": 0,
        "price": 0,
        "vol": 0,
        "numSh": 0,
        "annual": 0,
        "daily": 0,
    }
    # Assuming data is json where stock code is in .code
    most_recent = json.loads(api.stock_last(code))
    # # Assuming that api.stock_last() returns a json
    out["cap"] = most_recent["cap"]
    out["price"] = most_recent["price"]
    out["vol"] = most_recent["vol"]
    out["numSh"] = most_recent["numSh"]
    out["annual"] = most_recent["annual"]
    out["daily"] = most_recent["daily"]
    # returning jsonified dictionary containing all the relevant details
    return jsonify(out)

@app.route('/historicalGrab', methods=['POST'])
def grabHistoricals():
    code = request.json
    # Assuming data is nested json where stock code is in .code
    historicals = api.stock_last_week(code)
    return jsonify(historicals)


@app.route('/loginCheck', methods=['POST'])
def checkLogin():
    data = request.json 

    res = {
        "allowLogin": False,
        "capital": 0
    }

    # Checks whether user credentials match
    db.initialise()
    if(cr.match_credentials(data['email'], data['pass'])):
        res["allowLogin"] = True 
        res["capital"] = tr.getCapital(data['email'])
    
    return jsonify(res)

@app.route('/getCookie', methods=['GET'])
def retrieveSession():
    result = {
        "user": None,
        "sessionToken": None
    } 

    if 'user' in request.cookies:
        result['user'] = request.cookies.get('user')

    return jsonify(result)


@app.route('/searchStock', methods=['POST'])
def retrieveStockList():
    code = request.json 
    result = None

    if(code == ""):
        result = api.search("A")
    else:
        result = api.search(code)
        if(len(result) == 0): 
            result = [{
                "id": 1,
                "name": "No results available",
                "code": "No results available",
                "change": 0,
                "close": 0,
                "key": "empty_list_key"
            }]
    return jsonify(result)

# Retrieves the watchlist from the database.
# the user email has '@' replaced with '%40' when it is turned into a cookie
# .replace() turns it back into a proper email address
# return a 0 result when there is no stocks associated with an account
# return a list of dicts when there are results, just like in search.
@app.route('/retrieveWatchlist', methods=['POST'])
def retrieveWatchlist():
    user = request.json
    results = []
    stocks = wl.return_watchlist(user)
    if len(stocks) == 0:
        results = []
    else:   
        i = 0
        for stock_code in stocks:#stock:company_code
            i += 1
            # most recent is the latest data on that stock
            most_recent = api.retrieve_stock_base_info(stock_code)
            # Fill the dictThing with the data needed
            stockData = {
                "id": i,
                "code": stock_code,
                "change": most_recent["change"],
                "close": most_recent["close"],
                "name": most_recent["name"],
                "key": stock_code + "_key"
            }
            results.append(stockData)
    return jsonify(results)

# Given a stock code, does the user have that stock?
# return true/false
@app.route('/checkStockWatchlist', methods=['POST'])
def checkStockWatchlist():
    data = request.json
    receivedStock = data['code']
    stocks = wl.return_watchlist(data['user'])
    result = False
    for stock_code in stocks:
        if receivedStock == stock_code:
            result = True
    return jsonify(result)

# Given a stock code and add to watchlist
# If success,return True
# else return False
@app.route('/addToWatchlist', methods=['POST'])
def addToWatchlist():
    data = request.json
    receivedStock = data['code']
    user = data['user']
    result = wl.insert_watchlist(user, receivedStock)
    return jsonify(result)

# Given a stock code and remove from watchlist
# If success,return True
# else return False
@app.route('/rmFromWatchlist', methods=['POST'])
def rmFromWatchlist():
    data = request.json
    deleteStock = data['code']
    user = data['user']
    result = wl.delete_watchlist(user, deleteStock)
    return jsonify(result)

@app.route('/transaction', methods=['POST'])
def processTransaction():
    data = request.json
    # Need to convert quantity to numeric form as it is stored as a string in the request
    data['quantity'] = int(data['quantity'])

    response = {
        "error": False,
        "err_msg": ''
    }

    if(data['quantity'] <= 0):
        response["error"] = True
        response["err_msg"] = "Cannot buy or sell zero or negative stocks"
        return jsonify(response)
    

    if(data["request"] == "buy"):
        try:
            tr.buyStock(data['email'], data['code'], data['quantity']) 
        except Exception as err:
            response["error"] = True 
            response["err_msg"] = str(err) 
    elif(data["request"] == "sell"):
        try:
            tr.sellStock(data['email'], data['code'], data['quantity']) 
        except Exception as err:
            response["error"] = True 
            response["err_msg"] = str(err) 
    
    return jsonify(response)


@app.route('/quickFetch', methods=['POST'])
def quickFetch():
    # Data object stores two items, data['code'] to get the company to search for 
    # and data['request'] to indicate what type of information to fetch
    data = request.json
    result = None
    if "code" in data:
        name = data['code'] + ".ax"
        stock = yf.Ticker(name.lower())
        stock_hist = stock.history(period="1mo", interval="1d")
        stock_hist = pd.DataFrame(stock_hist)

        if(data['request'] == "price"):
            result = round(api.stock_current_price_last(stock_hist), 4)
        elif(data['request'] == "bet"):
            fetch = api.stock_generic(data['code'])
            result = {
                "performance": fetch[0],
                "latest": fetch[1],
                "capital": tr.getCapital(data['user'])
            }

    elif (data['request'] == "capital"):
        result = tr.getCapital(data['user'])
            
    return jsonify(result)

# Given a user email, retrieve a list of stock associated with the current user
@app.route('/getPortfolio', methods=['POST'])
def retrievePortfolio():
    data = request.json
    asset_list = tr.getPortfolioList(data['email'])
    return jsonify(asset_list)

@app.route('/advisor_sell',methods=['POST'])
def retrieveSellAdvice():
    user = request.json
    stocks = ad.getSellAdvice(user)
    i = 0
    results = []
    for stock in stocks:#stock:company_code
        i += 1
        # most recent is the latest data on that stock
        most_recent = api.retrieve_stock_base_info(stock["code"])
        # Fill the dictThing with the data needed
        stockData = {
            "id": i,
            "code": stock["code"],
            "name": db.desanitiseOutput(stock["name"]),
            "change": most_recent["change"],
            "key": stock["code"] + "_key"
        }
        results.append(stockData)
    return jsonify(results)

@app.route('/advisor_buy', methods=['GET'])
def retrieveBuyAdvice():
    stocks = ad.getBuyAdvice()
    i = 0
    results = []
    for stock in stocks:#stock:company_code
        i += 1
        # most recent is the latest data on that stock
        most_recent = api.retrieve_stock_base_info(stock["code"])
        # Fill the dictThing with the data needed
        stockData = {
            "id": i,
            "code": stock["code"],
            "name": db.desanitiseOutput(stock["name"]),
            "change": most_recent["change"],
            "key": stock["code"] + "_key"
        }
        results.append(stockData)
    return jsonify(results)

# Get capital and owned for advisor_buy and advisor sell
@app.route('/getCapitalAndOwn',methods=['POST'])
def getCapital():
    data = request.json
    user = data['user']
    stock_code = data['stock']
    num = ad.own_num_of_stocks(user,stock_code)
    capital = tr.getCapital(user)
    Data = {
        'capital':capital,
        'numOfOwn':num,
    }
    return jsonify(Data)

# Given a search code, retrieve a list of stock name and code associated with it
@app.route('/getCompany', methods=['POST'])
def retrieveCompany():
    code = request.json
    result = api.retrieveCompanyList(code.upper())
    if(len(result) == 0):
        tmp = {
            "key": "no_bet_key",
            "id": 1,
            "name": "Company Does Not Exist",
            "code": "No results available",
        }
        result.append(tmp)
    
    return jsonify(result)


# Given a user email, company code, betting amount and reward multiplier
# Create an active bet in the betting table for the user
@app.route('/createBet', methods=['POST'])
def generateUserBet():
    data = request.json 
    result = {
        "valid": False,
        "err_msg": ""
    }

    try:
        valid = bt.createBet(data['email'], data['code'], data['choice'], data['amount'], data['mult'])
        result["valid"] = valid
    except Exception as err:
        result["err_msg"] = str(err) 
    
    return jsonify(result)

# Return all previous bets for a user as JSON
@app.route('/getBetHistory', methods=['POST'])
def getBetHistory():
    user = request.json 
    result = bt.getBetHistory(user)

    if(len(result) == 0):
        tmp = {
            "key": "bet_hist_empty",
            "id": 1,
            "bet_id": "No Active Bet",
            "code": "No Active Bet",
            "amount": 0,
            "reward": 0, 
            "status": "N/A"
        }
        result.append(tmp)
    
    return jsonify(result)

# Calls the betUpdate function to check if it needs to be updated.
@app.route('/updateActiveBet', methods=['POST'])
def updateActiveBet():
    user = request.json 
    result = bt.updateBetHistory(user)

    return jsonify(result)

# Gets the revenue and capital and calculates the total gains
# Gains = revenue + capital - starting wallet amount
# Returns a json of capital and gain
@app.route('/accountGains', methods=['POST'])
def accountGains():
    user = request.json['user'] 
    revenue = tr.getRevenue(user)
    capital = tr.getCapital(user)
    gain = revenue + capital - cr.startingCapital
    result = {
        'fund': capital,
        'gain': gain,
        'revenue': revenue
    }
    return jsonify(result)

@app.route('/forgotPassword', methods=['POST'])
def forgotPassword():
    info = request.json
    result = cr.forgotPassword(info)
    return jsonify(result)

@app.route('/changePassword', methods=['POST'])
def changePassword():
    info = request.json
    data = info["state"]
    result = cr.changePasswordErrCheck(info)
    return jsonify(result)

# Get security question
@app.route('/getSecurity', methods=['POST'])
def getSecurity():
    data = request.json
    if not cr.account_exist(data):
        return jsonify('')
    result = cr.getSecurityQ(data)
    return jsonify(result)

#  assuming user is already login on
#  data will pass user email and repeated the password
@app.route('/removeAccount',methods=['POST'])
def deleteAccount():
    data = request.json
    res = cr.removeAccount(data['user'], data['password'], data['repeatPass'])
    return jsonify(res)


@app.route('/getLiveMarket', methods=['POST'])
def getLiveInfo():
    code = request.json
    result = api.stock_live_market(code)
    return jsonify(result)


@app.route('/getDailyMarket', methods=['POST'])
def getDailyInfo():
    data = request.json 
    result = api.stock_watchlist_graph(data['code'], data['user'])
    return jsonify(result)

if __name__ == '__main__':
   app.run()
