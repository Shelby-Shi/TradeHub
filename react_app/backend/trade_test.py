import pytest
import sqlite3
import database as db
import credentials as cr
import trade as tr
import bcrypt
import os

# Setup testdb, first remove existing copies
def pytest_setup():
    if os.path.isfile('testdb.db'):
        os.remove('testdb.db')
    db.dbPath = os.path.abspath('testdb.db')
    cr.dbPath = os.path.abspath('testdb.db')
    tr.dbPath = os.path.abspath('testdb.db')

    db.initialise()

    # Add initial data for testing
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    hashed1 = bcrypt.hashpw(b'password1', bcrypt.gensalt()).decode()
    hashed2 = bcrypt.hashpw(b'password2', bcrypt.gensalt()).decode()

    conn = sqlite3.connect(cr.dbPath)
    cur = conn.cursor()
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES (\'{}\', \'{}\', 1, \'{}\', \'{}\')'.format(email1, hashed1, 'q', 'a')
    cur.execute(sql)
    sql = 'INSERT INTO account (email, password, capital, secQ, secA) VALUES (\'{}\', \'{}\', 1000, \'{}\', \'{}\')'.format(email2, hashed2, 'q', 'a')
    cur.execute(sql)
    sql = 'INSERT INTO portfolio (user_id, company_id, total_quantity, avg_price) VALUES (1, 9, 10, 11)'
    cur.execute(sql)
    sql = 'INSERT INTO portfolio (user_id, company_id, total_quantity, avg_price) VALUES (1, 1274, 10, 11)'
    cur.execute(sql)
    sql = 'INSERT INTO portfolio (user_id, company_id, total_quantity, avg_price) VALUES (2, 1274, 100, 101)'
    cur.execute(sql)
    conn.commit()
    conn.close()

# Run pytest_setup once at start of tests
pytest_setup()

# Get user id depending on email, assuming email is valid and exists
def test_getUserId():
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    assert 1 == tr.getUserId(email1)
    assert 2 == tr.getUserId(email2)
    

# Check company code is valid
def test_valid_code():
    valid = 'CBA'
    invalid = 'ZZZ'
    null = ''
    assert True == tr.valid_code(valid)
    assert False == tr.valid_code(invalid)
    assert False == tr.valid_code(null)
    
# Get company id depending on the ASX code, assuming company code is valid and exists
def test_getCompanyId():
    first = '360'
    tenth = '4DS'
    one_thousand_four_hundred = 'TWE'
    assert 1 == tr.getCompanyId(first)
    assert 9 == tr.getCompanyId(tenth)
    assert 1274 == tr.getCompanyId(one_thousand_four_hundred)

#def test_getCompanyCode():

# Get capital for a user
def test_getCapital():
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    assert 1 == tr.getCapital(email1)
    assert 1000 == tr.getCapital(email2)

# Set capital of user to new value
def test_setCapital():
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    tr.setCapital(email1, 5)
    tr.setCapital(email2, -500)
    assert 5 == tr.getCapital(email1)
    assert -500 == tr.getCapital(email2)

# Checks if stocks of code are already owned
def test_checkOwned():
    first = '360'
    tenth = '4DS'
    one_thousand_four_hundred = 'TWE'
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    assert True == tr.checkOwned(email1, tenth)
    assert True == tr.checkOwned(email2, one_thousand_four_hundred)
    assert False == tr.checkOwned(email1, first)

# Retrieve portfolio for given user and company
def test_getPortfolio():
    p1 = tr.getPortfolio(1, 9)
    p2 = tr.getPortfolio(2, 1274)
    assert 10 == p1["total_quantity"]
    assert 11 == p1["avg_price"]
    assert 100 == p2["total_quantity"]
    assert 101 == p2["avg_price"]

# Buy a stock
def test_buyStock():
    pytest_setup()
    first = '360'
    tenth = '4DS'
    one_thousand_four_hundred = 'TWE'
    thirteen = '88E'
    invalid = 'ZZZ'
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    with pytest.raises(Exception, match="Not enough funds"):
        tr.buyStock(email1, tenth, 10000)

    with pytest.raises(Exception, match="Invalid company code"):
        tr.buyStock(email1, invalid, 1) 

    # buy stock did not owned before
    assert False == tr.checkOwned(email2, thirteen)
    capital0 = tr.getCapital(email2)
    tr.buyStock(email2, thirteen, 1)
    assert True == tr.checkOwned(email2, thirteen)
    capital1 = tr.getCapital(email2)
    assert True == (capital1 < capital0)
    p1 = tr.getPortfolio(tr.getUserId(email2), tr.getCompanyId(thirteen))
    assert 1 == p1["total_quantity"] 

    # buy stock owned before
    assert True == tr.checkOwned(email2, one_thousand_four_hundred)
    capital0 = tr.getCapital(email2)
    p0 = tr.getPortfolio(tr.getUserId(email2), tr.getCompanyId(one_thousand_four_hundred))
    tr.buyStock(email2, one_thousand_four_hundred, 1)
    assert True == tr.checkOwned(email2, one_thousand_four_hundred)
    capital1 = tr.getCapital(email2)
    assert True == (capital1 < capital0)
    p1 = tr.getPortfolio(tr.getUserId(email2), tr.getCompanyId(one_thousand_four_hundred))
    assert True == (p1["total_quantity"] > p0["total_quantity"])

def test_sellStock():
    pytest_setup()
    first = '360'
    tenth = '4DS'
    one_thousand_four_hundred = 'TWE'
    invalid = 'ZZZ'
    email1 = 'test@gmail.com'
    email2 = 'test2@gmail.com'
    email3 = 'test3@gmail.com'

    with pytest.raises(Exception, match=r"Invalid company code"):
        tr.sellStock(email1, invalid, 10)

    with pytest.raises(Exception, match=r"Selling more stocks than owned"):
        tr.sellStock(email1, tenth, 100)

    with pytest.raises(Exception, match=r"No stocks owned from this company"):
        tr.sellStock(email1, first, 100)
    
    # Sell all of stock tenth
    assert True == tr.checkOwned(email1, tenth)
    tr.sellStock(email1, tenth, 10)
    assert False == tr.checkOwned(email1, tenth)
    capital1 = tr.getCapital(email1)
    assert True == (capital1 > 1 and capital1 < 2)

    # Sell halves of stock 1400
    assert True == tr.checkOwned(email1, one_thousand_four_hundred)
    tr.sellStock(email1, one_thousand_four_hundred, 5)
    assert True == (tr.getPortfolio(1,1274)["total_quantity"] == 5)
    tr.sellStock(email1, one_thousand_four_hundred, 5)
    assert False == tr.checkOwned(email1, one_thousand_four_hundred)
    capital1 = tr.getCapital(email1)
    assert True == (capital1 > 20)
