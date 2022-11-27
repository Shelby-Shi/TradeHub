import pytest
import sqlite3, os, bcrypt
import database as db
import advisor as ad
import credentials as cr
import trade as tr

dbPath = os.path.abspath('testdb.db')
# Setup testdb, first remove existing copies
def pytest_setup():
    if os.path.isfile(dbPath):
        os.remove(dbPath)
    db.dbPath = dbPath
    cr.dbPath = dbPath
    tr.dbPath = dbPath
    ad.dbPath = dbPath

    db.initialise()

# Run pytest_setup once at start of tests
pytest_setup()

# Check all generated numbers are below numStocks
def test_generateNumber():
    for i in range(500000):
        test = ad.generateNumber()
        assert True == (test < ad.numStocks and test > 0)

def test_get_company_code():
    first = '360'
    tenth = '4DX'
    twenty = 'A2M'
    one_hundred = 'ANN'
    one_thousand_four_hundred = 'SVA'
    numbers = [1,10,20,100,1200]
    res = ad.get_company_code(numbers)
    assert True == (res[0]['code'] == first)
    assert True == (res[1]['code'] == tenth)
    assert True == (res[2]['code'] == twenty)
    assert True == (res[3]['code'] == one_hundred)
    assert True == (res[4]['code'] == one_thousand_four_hundred)


# Check getting 5 random stocks
def test_getBuyAdvice():
    pytest_setup()

    res = ad.getBuyAdvice()
    res2 = ad.getBuyAdvice()
    # Check 5 items in results
    assert 5 == (len(res) and len(res2))
    # Check lists are different
    assert res != res2

# Check for getstockowned return the correct list of stock_id
def test_getStocksOwned():
    pytest_setup()
    stock1 = 'ANZ'
    stock2 = 'ASX'
    stock3 = 'WOW'
    stock4 = 'ZMI'
    stock5 = 'TWE'
    stock6 = 'WSI'
    account = 'test@gmail.com'
    cr.createAccount(account,'password1','question','answer')
    tr.buyStock(account, stock1, 1)
    tr.buyStock(account, stock2, 1)
    res = ad.getStocksOwned(account)
    assert len(res) == 2
    assert sorted(res) == [104,142]
    tr.buyStock(account, stock3, 1)
    tr.buyStock(account, stock4, 1)
    tr.buyStock(account, stock5, 1)
    res = ad.getStocksOwned(account)
    assert len(res) == 5
    assert sorted(res) == [104, 142, 1274, 1348, 1374]

# Check sell advice is giving list of stocks that are actually owned
def test_getSellAdvice():
    pytest_setup()

    stock1 = 'ANZ'
    stock2 = 'ASX'
    stock3 = 'WOW'
    stock4 = 'ZMI'
    stock5 = 'TWE'
    stock6 = 'WSI'
    account = 'test@gmail.com'
    cr.createAccount(account,'password1','question','answer')
    res = ad.getSellAdvice(account)
    # Without any stocks, can't possibly suggest selling anything
    assert len(res) == 0

    tr.buyStock(account, stock1, 1)
    tr.buyStock(account, stock2, 1)
    for i in range(100):
        res = ad.getSellAdvice(account)
        assert len(res) >= 0 and len(res) <= 2
        assert (res == []) or (res[0]['code'] == 'ANZ') or (res[0]['code'] == 'ASX') or \
            (res[0]['code'] == 'ANZ' and res[1]['code'] == 'ASX') or (res[0]['code'] == 'ASX' and res[1]['code'] == 'ANZ')
    
    tr.buyStock(account, stock3, 1)
    tr.buyStock(account, stock4, 1)
    for i in range(100):
        res = ad.getSellAdvice(account)
        assert len(res) >= 0 and len(res) <= 4
    
    tr.buyStock(account, stock5, 1)
    tr.buyStock(account, stock6, 1)
    for i in range(100):
        res = ad.getSellAdvice(account)
        assert len(res) >= 0 and len(res) <= 5

# Check number of owned
def test_check_num_of_stock():
    pytest_setup()

    account = 'test@gmail.com'
    cr.createAccount(account,'password1','question','answer')
    
    stock_own = 'A2B'
    stock_not_own = 'A1G'
    tr.buyStock(account, stock_own, 100)
    assert ad.own_num_of_stocks(account,stock_own) == 100
    tr.buyStock(account, stock_own, 100)
    assert ad.own_num_of_stocks(account,stock_own) == 200
    # user doesn't have this stock, it should return 0
    assert ad.own_num_of_stocks(account,stock_not_own) == 0
