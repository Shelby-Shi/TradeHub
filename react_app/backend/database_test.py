import database as db
import advisor as ad
import os, sqlite3

# Setup testdb, first remove existing copies
def pytest_setup():
    if os.path.isfile('testdb.db'):
        os.remove('testdb.db')
    db.dbPath = os.path.abspath('testdb.db')
    ad.dbPath = os.path.abspath('testdb.db')
    db.initialise()

# Run pytest_setup once at start of tests
pytest_setup()

def test_initialise():
    conn = sqlite3.connect('testdb.db')
    cur = conn.cursor()

    # Check 'account' table exists
    tableName = 'account'
    sql = 'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'{}\';'.format(tableName)
    cur.execute(sql)
    res = cur.fetchall()
    assert len(res) != 0
    
    # Check 'company_code' table exists
    tableName = 'company_code'
    sql = 'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'{}\';'.format(tableName)
    cur.execute(sql)
    res = cur.fetchall()
    assert len(res) != 0
    
    # Check 'watchlist' table exists
    tableName = 'watchlist'
    sql = 'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'{}\';'.format(tableName)
    cur.execute(sql)
    res = cur.fetchall()
    assert len(res) != 0
    
    # Check 'portfolio' table exists
    tableName = 'portfolio'
    sql = 'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'{}\';'.format(tableName)
    cur.execute(sql)
    res = cur.fetchall()
    assert len(res) != 0

    # Check that company_code is filled with ad.numStocks amount of stocks
    sql = 'SELECT count(company_id) FROM company_code;'
    cur.execute(sql)
    res = cur.fetchall()
    assert ad.numStocks == res[0][0]

# Test that quotes are removed
def test_sanitiseInput():
    quotes = "'"
    assert "&#x27;" == db.sanitiseInput(quotes)

# Test we can de-sanitise to output
def test_desanitiseOutput():
    quotes = "&#x27;"
    assert "'" == db.desanitiseOutput(quotes)