# COMP3900-H11A-UNDEFINED
Lecturer/Admin: Matthew Sladescu
Tutors/Mentors: Rachid Hamadi

## Assessments
| Item | Due |
| ---  | --- |
| Proposal | Wk 3 Sunday |
| Demo A | Wk 5 Tute |
| Retro A | Wk 7 Tute |
| Demo B | Wk 8 Tute |
| Retro B | Wk 9 Tute |
| Submission | Wk 10 Monday |
| Final Demo | Wk 10 Tute |
| Peer Assess | Wk 10 Friday |

## InvestmentSimulator Specs
### Project Objectives
- Investors must be able to search for a stock using a "stock code"(also known as stock “symbol”), with results indicating the stock name, andlatest available unit price for the stock. 
- Each investor must be able to add stocks from search results to their personal visible watchlist, and remove stocks from this watch list, with each stock on this watch list showing: the stock code, latest available stock price per unit, and the percentage change in the stock unit price when comparing the latest available stock unit price to the previous day's known stock unit price.
- Investors must be able to view a graph showing the historical daily closing unit price for any stock on their watchlist, where historical data must at least be available from the day when the stock was added to the watchlistto now.
- Investors must be able to "simulate" a "buy" order for a given stock at the current market price per unit, for a given number of units (note that a "simulated" buy order means that a "buy" order isn't actually executed, and the investor doesn't actually own the stock -hence we call stock that is bought using a simulated "buy" order "simul-owned"). 
- An investor must be able to "simulate" a "sell" order for a given stock at the current market price per unit, for a given number of stock units, only for stock-units that they simul-own. 
- Investors must be able to view the total profit or loss they would make if all the stock units they currently simul-own were sold at their current market price per unit. They must be able to view the total profit or loss they would make for any given stock they simul-own, if all the units they simul-own for that stock were sold at the current market price per unit. 
- Investors must be able to see a page that lists aggregate statistics for each stock type simul-owned, including: total units simul-owned, total current worth of simul-owned units, total paid for currently simul-owned units.
- Some of the reference links you may find useful for this project are shown below. Please note that project objectives always take priority. https://finnhub.io/, https://medium.com/@andy.m9627/the-ultimate-guide-to-stock-market-apis-for-2020-1de6f55adbb

## First time Setup and Run
1. Open a terminal and clone the directory using git, or unpack the zip file:
```
$> git clone git@github.com:unsw-cse-capstone-project/capstone-project-comp3900-h11a-undefined.git h11a-undefined
```

2. Navigate to the new folder via the terminal, or open a terminal in the new folder:
```
$> cd h11a-undefined
```

3. Execute setup.sh. Please note that this process may take a few minutes to download and install the requirements, and fully initialise the web application.
```
$> ./setup.sh
```
Setup.sh is only needed for first time deployment of the web application, afterwards you only need to execute run.sh:
```
$> ./run.sh
```
The default web browser will automatically open and navigate to the deployed web application. If this does not occur, navigate to address localhost:3000. Ensure port 5000 is not blocked as the flask server will run on this port.

4. To close the web application, simply type CTRL-C in the terminal.