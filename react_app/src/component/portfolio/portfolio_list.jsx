import React, { Component } from "react"
import { Link } from "react-router-dom"
import Cookies from 'universal-cookie'

// portfolio child component
class PortfolioList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            assetList: null,
            display: null,
            total_rev: 0,
            total_paid: 0,
            total_profit: 0
        }

        this.updateRev = null;

        this.cookie = new Cookies();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.filterSearch = this.filterSearch.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
        this.calculateRevenueProfit = this.calculateRevenueProfit.bind(this);
    }


    // Could possibly have a set interval implementation to update user stock details every 10 minute?
    // send POST request to retrieve user's assets and calculate revenue/profit
    componentDidMount() {
        const user = this.cookie.get('user');
        const info = {
            email: user
        }
        
        if(user !== undefined){
            fetch("/getPortfolio",{
                method: "POST",
                cache: "no-cache",
                headers: {
                    "content-type":"application/json",
                },
                body: JSON.stringify(info)
            })
            .then(response => {
                return response.json()
            })
            .then(json => {
                //On initialisation display should show all user owned assets
                let result = (json.length === 0) ? this.filterSearch('') : json;
                this.setState({
                    assetList: json,
                    display: result
                }, this.calculateRevenueProfit)
            })

            

            // Creates update revenue interval
            this.updateRev = setInterval(this.calculateRevenueProfit, 10000)
        }

    }

    // check if a filter is needed to be performed,
    // then do it if so
    componentDidUpdate(prevProp) {
        // Do a local search in assetList to find associated stock code
        if(this.props.searchCode !== prevProp.searchCode){
            const new_arr = this.filterSearch(this.props.searchCode);
            this.setState({
                display: new_arr
            })
        }
    }

    // remove interval timer to stop POST requests.
    componentWillUnmount() {
        clearInterval(this.updateRev)
    }


    // Calculates total user revenue total paid and total profit
    calculateRevenueProfit() {
        if(this.state.assetList !== null) {
            const list = this.state.assetList;
            let revenue = 0;
            let total_paid = 0;

            for(var i in list) {
                const currRev = list[i]['value']
                const currPaid = list[i]['total_paid']
                revenue += currRev 
                total_paid += currPaid
            }
            this.setState({
                total_rev: revenue,
                total_paid: total_paid,
                total_profit: revenue - total_paid
            })
        }
    }

    // Local filter search, if an empty string '' is provided return all user owned assets 
    filterSearch(code) {
        let arr = [];
        const searchTerm = code.toUpperCase();
        const list = this.state.assetList;

        for(var i in list) {
            const stockCode = list[i]['code']
            if(stockCode.includes(searchTerm)){
                arr.push(list[i])
            }
        }

        // Case where a failed search occurs
        if(arr.length === 0){
            const empty = {
                id: 1,
                key: "NoAsset",
                quantity: 0,
                code: 0,
                performance: 0,
                latest: 0,
                value: 0,
                total_paid: 0
            }

            arr.push(empty)
        }
        return arr
    }


    // Create a cookie in preparation for stock details page to use
    handleSubmit(code) {
        this.cookie.set('code', code);
    }

    render() {
        let list = null;

        let notLoggedIn = <div className="Login-error"style={{textAlign:"center",fontWeight: "bold"}}>You are not logged in, Please login to access registered features!</div>
        const user = this.cookie.get('user');
        if(this.state.display !== null && user !== undefined) {
            list = this.state.display.map(obj => 
                <tr key={obj.key}>
                    <th scope="row">{obj.id}</th>
                    <td>{(obj.code === 0) ? "You do not own any stocks" : obj.code}</td>
                    <td>{obj.quantity}</td>
                    <td className={(obj.performance < 0) ? "text-danger" : "text-success"}>{obj.performance}%</td>
                    <td>${obj.latest}</td>
                    <td>${obj.value}</td>
                    <td>${obj.total_paid}</td>
                    <td className={(obj.value - obj.total_paid < 0) ? "text-danger ml-3" : "text-success ml-3"}>
                                {(obj.value - obj.total_paid >= 0) ? "+" : "-"}${Math.abs(obj.value - obj.total_paid)}</td>
                    <td>
                        <Link className="btn btn-outline-dark btn-sm" style={{display: (obj.code === 0) ? "none" : "block"}} to={{
                                pathname: "/details",
                                state: {
                                    code: obj.code,
                                    name: obj.name
                                }
                        }} onClick={() => this.handleSubmit(obj.code)}>View</Link>
                    </td>
                </tr>
            )
        }

        if(user === undefined) {
            let unavailable = <span className="badge badge-pill badge-dark">N/A</span>
            list = (
                <tr key="No_User_CL">
                    <th scope="row">1</th>
                    <td>{notLoggedIn}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                    <td/>
                </tr>
            )
           
        }

        return(
            <div className="container-fluid w-100">
                <table className="table table-striped">
                    <thead className="thead-dark">
                        <tr>
                            <th scope="col">#</th>
                            <th scope="col">Stock Code</th>
                            <th scope="col">Quantity</th>
                            <th scope="col">Performance</th>
                            <th scope="col">Latest Closing Price</th>
                            <th scope="col">Total Value</th>
                            <th scope="col">Total Paid</th>
                            <th scope="col">Profit/Loss</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>

                    <tbody>
                        {list}
                    </tbody>
                </table>

                <div className="container-fluid mt-5 w-50 justify-content-center">
                    <ul className="list-group">
                        <li className="list-group-item">
                            Total Revenue: <span className={(this.state.total_rev < 0) ? "text-danger ml-3" : "text-success ml-3"}>
                                {(this.state.total_rev >= 0) ? "+" : "-"}${Math.abs(this.state.total_rev)}</span>
                        </li>
                        <li className="list-group-item">
                            Total Paid: <span className={(this.state.total_paid > 0) ? "text-danger ml-3" : "text-success ml-3"}>
                                ${Math.abs(this.state.total_paid)}</span>
                        </li>
                        <li className="list-group-item">
                            Total Proft/Loss: <span className={(this.state.total_profit < 0) ? "text-danger ml-3" : "text-success ml-3"}>
                                {(this.state.total_profit >= 0) ? "+" : "-"}${Math.abs(this.state.total_profit)}</span>
                        </li>
                    </ul>
                </div>
            </div>
        )
    }
}
export default PortfolioList;