import sqlite3, html, csv, os

path = os.getcwd()
path = path[:path.index("react_app")] + 'react_app/'
dbPath = path + 'backend/users.db'
csvPath = path + 'backend/company_list.csv'

# Initialise database if none currently exists
def initialise():
    conn = sqlite3.connect(dbPath)
    cur = conn.cursor()
    # Check 'account' table exists
    tableName = 'account'
    sql = 'SELECT name FROM sqlite_master WHERE type=\'table\' AND name=\'{}\';'.format(tableName)
    cur.execute(sql)
    res = cur.fetchall()
    # If account table doesn't exist, create and commit a new empty database
    if (len(res) == 0):
        # Turn foreign key support on
        sql = 'PRAGMA foreign_key=ON'
        cur.execute(sql)

        # User account table
        sql = 'CREATE TABLE account ( ' + \
            'user_id INTEGER PRIMARY KEY, ' + \
            'email TEXT NOT NULL UNIQUE, ' + \
            'password TEXT NOT NULL, ' + \
            'capital REAL NOT NULL,' + \
            'secQ TEXT NOT NULL, ' + \
            'secA TEXT NOT NULL)'
        cur.execute(sql)
        
        # ASX Company list table
        sql = 'CREATE TABLE company_code ( company_id INTEGER PRIMARY KEY, code TEXT NOT NULL UNIQUE, name TEXT NOT NULL)'
        cur.execute(sql)

        # User watchlist table
        sql = 'CREATE TABLE watchlist (' + \
            'user_id INTEGER, ' + \
            'company_id INTEGER, ' + \
            'start_date INTEGER NOT NULL,' + \
            'FOREIGN KEY(user_id) REFERENCES account(user_id), ' + \
            'FOREIGN KEY(company_id) REFERENCES company_code(company_id), ' + \
            'PRIMARY KEY(user_id, company_id))'
        cur.execute(sql)
        
        # User portfolio table
        sql = 'CREATE TABLE portfolio ( ' + \
            'user_id INTEGER, ' + \
            'company_id INTEGER, ' + \
            'total_quantity INTEGER NOT NULL, ' + \
            'avg_price REAL NOT NULL, ' + \
            'FOREIGN KEY(user_id) REFERENCES account(user_id), ' + \
            'FOREIGN KEY(company_id) REFERENCES company_code(company_id), ' + \
            'PRIMARY KEY(user_id, company_id))'
        cur.execute(sql)


        # User betting table
        # status 1 for win, 0 for lose, -1 for not avalible
        sql = 'CREATE TABLE betting ( ' + \
            'user_id INTEGER, ' + \
            'company_id INTEGER, ' + \
            'bet_amount REAL NOT NULL,' + \
            'growth INTEGER NOT NULL,' + \
            'start_price REAL NOT NULL,' + \
            'start_date INTEGER NOT NULL,' + \
            'multiplier INTEGER NOT NULL,' + \
            'FOREIGN KEY(user_id) REFERENCES account(user_id), ' + \
            'FOREIGN KEY(company_id) REFERENCES company_code(company_id), ' + \
            'PRIMARY KEY(user_id, company_id))'
        cur.execute(sql)

        sql = 'CREATE TABLE bet_history ( ' + \
            'Bet_id INTEGER, ' + \
            'user_id INTEGER, ' + \
            'company_id INTEGER, ' + \
            'bet_amount REAL NOT NULL,' + \
            'growth INTEGER NOT NULL,' + \
            'end_date INTEGER NOT NULL,' + \
            'reward REAL,' + \
            'status TEXT NOT NULL,' + \
            'FOREIGN KEY(user_id) REFERENCES account(user_id), ' + \
            'FOREIGN KEY(company_id) REFERENCES company_code(company_id), ' + \
            'PRIMARY KEY(Bet_id))'
        cur.execute(sql)

        # Fill company_code with list of companies from company_list.csv
        with open(csvPath, newline='') as csvfile:
            reader = csv.reader(csvfile, delimiter=',', quotechar='|')
            for row in reader:
                # Add to database
                sql = 'INSERT INTO company_code (code,name) VALUES (\'{}\',\'{}\')'.format(row[1],sanitiseInput(row[0]))
                cur.execute(sql)
        conn.commit()
    conn.close()

# Escapes special characters
def sanitiseInput(userInput):
    sanitised = html.escape(userInput)
    return sanitised

# Adds back special characters
def desanitiseOutput(output):
    output = output.replace("&#x27;", "'")
    desanitised = output.replace("&amp;", "&")
    return desanitised

# Assuming that if executing database.py as program, that user is trying to initialise a new database
if __name__ == "__main__":
    if os.path.isfile(dbPath):
        delete = input("Would you like to delete the existing database and create a new empty db? [Y/N]: ")
        if delete.lower() == 'y':
            os.remove(dbPath)
    initialise()
