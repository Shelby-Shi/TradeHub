import sqlite3
import html
import csv
import os 
import api
from csv import writer

path = os.getcwd()
path = path[:path.index("react_app")] + 'react_app/'
csvPath = path + 'backend/company_list.csv'

# Orginially, we download the csv from asx
# We filter out the companies by following requirement
# 1.it should contained data for close price and changing price
# 2.it has volumn data in any last five days which indicates it has been transacted. 
with open('new.csv', mode='w') as file:
    writer = csv.writer(file, delimiter=',', quotechar='|')
    with open('company_list.csv', newline='') as csvfile:
                reader = csv.reader(csvfile, delimiter=',', quotechar='|')
                for row in reader:
                    try:
                        # check the company_code has valid data
                        info = api.stock_generic(row[1])
                        if info[0] != 0 and info[1] !=0:
                            print(row[1])
                            vol = api.stock_last_week(row[1])
                            # check company_code have data for last five days
                            for daily in vol:
                                count = 0
                                if daily['volume'] != 0:
                                    count+=1
                            if count > 0:
                                writer.writerow(row)
                            else:
                                print("no info",row[1])
                    except:
                        print("no info",row[1])
writer.close()  
reader.close()            
                        