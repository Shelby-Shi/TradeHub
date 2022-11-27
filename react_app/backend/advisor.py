import sqlite3, secrets, os
import database as db
import watchlist as wl
import trade as tr
# Global vars
numStocks = 1376
numSuggest = 5
sellChance = 0.5

path = os.getcwd()
path = path[:path.index("react_app")] + 'react_app/'
dbPath = path + 'backend/users.db'

# Generates crytographically secure random number from 1 - numStocks
def generateNumber():
    return secrets.choice(range(1,numStocks))

# Return array containing numSuggest company codes given company ids
def get_company_code(stocks):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    res = []
    # For each stock id, fetch the stock code and company name
    for stock in stocks:
        sql = 'SELECT code,name FROM company_code WHERE company_id = {}'.format(stock)
        cur.execute(sql)
        temp = cur.fetchall()
        code = temp[0][0]
        name = temp[0][1]
        pair = {'code':code,'name':name}
        res.append(pair)     
    conn.close()
    return res

# Return a list of dictionaries to advise user to buy
# Dictionary items are code, name pairs
def getBuyAdvice():
    res = []
    while len(res) < numSuggest:
        num = generateNumber()
        res.append(num)
        res = list(set(res))
    return get_company_code(res)

# Get a list of all stocks owned by user
def getStocksOwned(email):
    stocks = []
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT user_id from account where email=\'{}\''.format(email)
    cur.execute(sql)
    res = cur.fetchall()
    if len(res) == 1:
        user_id = res[0][0]
        sql = "select company_id from portfolio where user_id = \'{}\'".format(user_id)
        cur.execute(sql)
        res = cur.fetchall()
        # Append every company id to stocks var and return list
        for i in res:
            stocks.append(i[0])
    conn.close()
    return stocks

# Pick random stocks from user's portfolio and return list 
def getSellAdvice(email):
    suggest_sell = round(secrets.choice(range(0, 100))/100,3)
    stocks = []
    # have a chance to suggest user to not sell any stocks
    if suggest_sell >= sellChance:
        suggest_sell = []
        stocks = getStocksOwned(email)
        # If user owns any stocks, return at most numSuggest stock suggestions
        if len(stocks) != 0:
            nums_of_stocks = secrets.choice(range(1, min( len(stocks)+1 , numSuggest+1 ) ))
            while len(suggest_sell) < nums_of_stocks:
                suggest_sell.append(secrets.choice(stocks))
                suggest_sell = list(set(suggest_sell))
            stocks = get_company_code(suggest_sell)
    return stocks

# Check user have num of specific stocks
# If they don't have,return 0
# Else return the number
def own_num_of_stocks(email,company_code):
    user_id = tr.getUserId(email)
    company_id = tr.getCompanyId(company_code)
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT total_quantity from portfolio where user_id={} and company_id={}'.format(user_id,company_id)
    cur.execute(sql)
    res = cur.fetchall()
    conn.close()
    if len(res) == 0:
        return 0
    else:
        return res[0][0]