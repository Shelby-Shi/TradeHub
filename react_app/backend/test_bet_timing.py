import sqlite3
import re
import database as db
import api
import datetime as dt
from datetime import date, timedelta
import time
import trade as tr
import credentials as cr

#this script is for forcing the active bet associated with dom@gmail.com to close, for demo purposes
today = dt.date.today()
start_date = today + timedelta(days = -12)
start_date = time.mktime(start_date.timetuple())

end_date = today + timedelta(days = -2)
end_date = time.mktime(end_date.timetuple())

user_id = tr.getUserId('dom@gmail.com')
conn = sqlite3.connect('users.db')
cur = conn.cursor()
sql = 'UPDATE bet_history SET end_date = \'{}\' WHERE user_id = {} AND status = \'{}\''.format(end_date, user_id, "active")
cur.execute(sql)
conn.commit()
sql = 'UPDATE betting SET start_date = \'{}\' WHERE user_id = {}'.format(start_date, user_id)
cur.execute(sql)
conn.commit()
conn.close()

