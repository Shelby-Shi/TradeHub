import React, { Component } from "react"
import Navbar from "../global/navbar"
import "../../css/stockDetail/stock_detail.css"
import Overview from "./stock_overview.jsx"
import Historicals from "./stock_history.jsx"
import WatchlistButtons from "./stock_watchlist_buttons.jsx"
import TransactionButton from "./stock_transaction.jsx"
import StockGraph from "./stock_graph.jsx"
import Cookies from 'universal-cookie';

// Stock detail page
// Contains: stock historical, overview, transaction butons, and watchlist buttons
class StockDetail extends Component {
    constructor(props) {
        super(props)
        this.state = {
            name: null,
            code: null
        }

        this.cookie = new Cookies()
        this.cookie.set('code', this.props.location.state.code);
        this.componentDidMount = this.componentDidMount.bind(this)
        this.componentWillUnmount = this.componentWillUnmount.bind(this)
    }

    // Set the state of code when page loads
    componentDidMount() {
        this.setState({
            name: this.props.location.state.name,
            code: this.props.location.state.code
        })
    }

    // Removes cookies used in stock detail page when page unloads
    componentWillUnmount() {
        this.cookie.remove('code');
    }

    render() {
        return(
            <div>
                <Navbar />

                {/* Stock code as the title */}
                <div className="container-fluid w-100 d-flex flex-row justify-content-around mt-5">
                    <h1>{this.state.name}</h1>  
                </div>
                {/* Graph of the performance */}
                <StockGraph code={this.state.code}/>

                <div className="container-fluid w-100 mt-5 px-5 d-flex flex-row justify-content-around">
                    {/* Current overview of stock */}
                    <Overview searchCode={this.state.code}/>
                    {/* Transaction and watchlist buttons */}
                    <div className="container-fluid w-50 pt-5" style={{backgroundColor:"none"}}>
                        <WatchlistButtons code={this.state.code}/>
                        <TransactionButton />
                    </div>
                </div>
                {/* 5-day historicals */}
                <div className="container-fluid w-100 d-flex flex-row justify-content-around mt-5">
                    <Historicals searchCode={this.state.code}/>
                </div>
            </div>
        );
    }
}


export default StockDetail;