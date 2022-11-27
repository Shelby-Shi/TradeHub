#!/bin/sh
echo 'Setting up and running TradeHub web app'
cd react_app
python3 -m venv env
source env/bin/activate
pip install -r requirements.txt
npm install
xterm -r -e ./flask.sh & xterm -r -e ./node.sh