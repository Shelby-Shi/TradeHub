#!/bin/sh
echo 'Running TradeHub web app'
cd react_app
xterm -r -e ./flask.sh & xterm -r -e ./node.sh