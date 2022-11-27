import React from 'react';
import ReactDOM from 'react-dom';
import '../node_modules/bootstrap/dist/css/bootstrap.min.css';

import { BrowserRouter as Router, Route } 
from "react-router-dom";

import Home from './component/frontpage/homepage.jsx';
import Login from './component/setup/login.jsx';
import Register from './component/setup/register.jsx';
import ForgotPassword from './component/setup/forgot_password.jsx';
import Betting from './component/betting/betting.jsx';
import Account from "./component/account/accountPage.jsx";
import StockSearch from "./component/stockSearch/stock_search.jsx";
import StockDetail from "./component/stockDetail/stock_detail.jsx";
import Watchlist from "./component/watchlist/watchlist.jsx";
import Portfolio from "./component/portfolio/portfolio.jsx";
import Advisor from "./component/advisor/advisor.jsx";
import DeleteAccount from "./component/account/delete_account.jsx"
import * as serviceWorker from './serviceWorker';

const routing = (
  <Router>
    <div>
      <Route exact path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/account" component={Account} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/market" component={StockSearch} />
      <Route path="/details" component={StockDetail} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/advisor" component={Advisor} />
      <Route path="/game" component={Betting} />
      <Route path="/forgotPassword" component={ForgotPassword} />
      <Route path="/closeAccount" component={DeleteAccount} />
    </div>
  </Router>
)
  
ReactDOM.render(
  routing,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
