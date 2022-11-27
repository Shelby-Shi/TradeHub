
import sqlite3
import api

import os 
path = os.getcwd()
path = path[:path.index("react_app")] + 'react_app/'
dbPath = path + 'backend/users.db'

# Get user id depending on email, assuming email is valid and exists
def getUserId(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT user_id FROM account WHERE email = \'{}\''.format(email)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    return result[0][0]

# Check company code is valid
# returns true/false on success/failure
def valid_code(code):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT code FROM company_code WHERE code = \'{}\''.format(code)
    cur.execute(sql)
    results = cur.fetchall()
    conn.close()
    # Check result exists
    if len(results) == 0:
        return False
    return True

# Get company id depending on the ASX code, assuming company code is valid and exists
def getCompanyId(code):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT company_id FROM company_code WHERE code = \'{}\''.format(code)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    return result[0][0]

# Given a company id, return the associated stock code
def getCompanyCode(company_id):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT code FROM company_code WHERE company_id = \'{}\''.format(company_id)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    return result[0][0]

# Given a company code, return the company's name
def getCompanyName(code):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT name FROM company_code WHERE code = \'{}\''.format(code)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    return result[0][0]

# Get capital for a user, given an email
def getCapital(email):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT capital FROM account WHERE email = \'{}\''.format(email)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()
    return result[0][0]

# Set capital of user to new value
def setCapital(email, capital):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'UPDATE account SET capital = {} WHERE email = \'{}\''.format(capital, email)
    cur.execute(sql)
    conn.commit()
    conn.close()

# Checks if stocks of code are already owned
# returns true if owned, otherwise false
def checkOwned(email, code):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    user_id = getUserId(email)

    # Get all owned stocks
    sql = 'SELECT company_id FROM portfolio WHERE user_id = {}'.format(user_id)
    cur.execute(sql)
    result = cur.fetchall()
    conn.close()

    company_id = getCompanyId(code)
    if len(result) == 0:
        return False

    # Check if company of code is in list of owned stocks
    for item in result:
        if item[0] == company_id:
            return True
    return False

# Retrieve portfolio for given user and company
def getPortfolio(user_id, company_id):
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    sql = 'SELECT total_quantity, avg_price FROM portfolio WHERE user_id = {} AND company_id = {}'.format(user_id, company_id)
    cur.execute(sql)
    results = cur.fetchall()
    conn.close()
    res = {
        "total_quantity": results[0][0],
        "avg_price": results[0][1]
    }
    return res

# Buy a stock, given user's email, a stock code and quantity they wish to buy
def buyStock(email, code, quantity):
    # Check company code is valid
    if valid_code(code) == False:
        raise Exception('Invalid company code')

    price = api.stock_current_price(code)
    value = price * quantity

    # Check enough funds
    capital = getCapital(email)
    if capital < value:
        raise Exception('Not enough funds')

    user_id = getUserId(email)
    company_id = getCompanyId(code)
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    
    # Check if already owns stock from this code
    if checkOwned(email, code) == True:
        # Get previous values
        prev = getPortfolio(user_id, company_id)
        prevQuantity = prev["total_quantity"]
        prevPrice = prev["avg_price"]
        prevValue = prevPrice * prevQuantity

        # Calculate new total quantity and avg price
        newValue = prevValue + value
        newQuantity = prevQuantity + quantity
        newPrice = newValue / newQuantity

        # Update database
        sql = 'UPDATE portfolio SET total_quantity = {}, avg_price = {} WHERE user_id = {} AND company_id = {}'\
            .format(newQuantity, newPrice, user_id, company_id)
    else:
        # Set total quantity and avg price
        sql = 'INSERT INTO portfolio (user_id, company_id, total_quantity, avg_price) ' + \
            'values ({}, {}, {}, {});'.format(user_id, company_id, quantity, price)
    
    cur.execute(sql)
    conn.commit()
    conn.close()

    # Take funds from capital
    remain = capital - value
    setCapital(email, remain)

# Sell a stock, given user's email, a stock code and quantity they wish to sell
def sellStock(email, code, quantity):
    # Check company code is valid
    if valid_code(code) == False:
        raise Exception('Invalid company code')

    price = api.stock_current_price(code)
    value = price * quantity
    user_id = getUserId(email)
    company_id = getCompanyId(code)

    # Check own enough of the stock to sell quantity
    if checkOwned(email, code) == True:
        prev = getPortfolio(user_id, company_id)
        prevQuantity = prev["total_quantity"]
        if prevQuantity < quantity:
            raise Exception('Selling more stocks than owned')
    else:
        raise Exception('No stocks owned from this company')

    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    
    # Check if selling all or need to recalculate portfolio
    if quantity != prevQuantity:
        # Get previous values
        prevPrice = prev["avg_price"]
        prevValue = prevPrice * prevQuantity

        # Calculate new total quantity and avg price
        newValue = prevValue - value
        newQuantity = prevQuantity - quantity
        newPrice = newValue / newQuantity

        # Update database
        sql = 'UPDATE portfolio SET total_quantity = {}, avg_price = {} WHERE user_id = {} AND company_id = {}'\
            .format(newQuantity, newPrice, user_id, company_id)
    else:
        # Delete entire row from portfolio
        sql = 'DELETE FROM portfolio WHERE user_id = {} AND company_id = {}'.format(user_id, company_id)
    
    cur.execute(sql)
    conn.commit()
    conn.close()

    # Add funds to capital
    capital = getCapital(email)
    gain = capital + value
    setCapital(email, gain)


# Retrieve all assets/stock owned by a users
def getPortfolioList(email):
    response = []
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    user_id = getUserId(email)

    # Retreive all stock associated with user
    sql = 'SELECT portfolio.company_id, portfolio.total_quantity, company_code.code, portfolio.avg_price FROM portfolio \
          INNER JOIN company_code ON portfolio.company_id = company_code.company_id WHERE user_id = {}'.format(user_id)
    cur.execute(sql)
    results = cur.fetchall()
    i = 1
    for x in results:
        # Retrieve stock generic information such as 5 days overall performance and latest closing price
        # stockInfo[0] refers to the 5 day change and stockInfo[1] refers to latest closing price
        stockInfo = api.stock_generic(x[2])
        info = {
            'id': i,
            'key': "UA-" + str(i),
            'quantity': x[1],
            'code': x[2],
            'performance': stockInfo[0],
            'latest': stockInfo[1],
            'value': round(x[1] * stockInfo[1], 2),
            'total_paid': round(x[3]*x[1], 2)
        }
        response.append(info)
        i += 1
    conn.close()
    return response

# Calculate total value of all currently held stocks for a given user.
# Returns a float
def getRevenue(email):
    portList = getPortfolioList(email)
    revenue = 0
    for port in portList:
        revenue += port['value']
    return revenue