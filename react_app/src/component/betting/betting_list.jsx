import React, { Component } from "react"
import BetModal from './betting_modal.jsx'
import Cookies from 'universal-cookie'

// list of bets component
class BetList extends Component {

    constructor(props) {
        super(props);
        this.state = {
            code: null,
            triggerChange: false, 
            companyList: null,
            betList: null
        }

        this.updateBetHistoryInterval = null;
        this.updateActiveInterval = null;

        this.cookie = new Cookies();
        this.handleShow = this.handleShow.bind(this);
        this.updateBetHistory = this.updateBetHistory.bind(this);
        this.updateActiveBet = this.updateActiveBet.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
    }

    // send a POST request to get initial data
    componentDidMount() {
        const user = this.cookie.get('user');
        if(user !== undefined){
            fetch("/getCompany",{
                method: "POST",
                cache: "no-cache",
                headers: {
                    "content-type":"application/json",
                },
                body: JSON.stringify(this.props.searchCode)
            })
            .then(response => {
                return response.json()
            })
            .then(json => {
                // On initialisation fetch a list of company names
                this.setState({
                    companyList: json,
                })
            })

            // Gets user active bet list
            this.updateBetHistory();

            // Checks if the user active bet session has passed, if so do some updating
            this.updateActiveBet();

            // Set an interval to update the bet history table every 10 second for testing purpose (Will change to 1min to 5 min)
            this.updateBetHistoryInterval = setInterval(this.updateBetHistory, 10000);

            // Set an interval to run the updateActiveBet() function every 10 second for testing purpose (Will change to 1min to 5 min)
            this.updateActiveInterval = setInterval(this.updateActiveBet, 10000);
        }
    }

    // update company list on state update
    componentDidUpdate(prevProp) {
        if(this.props.searchCode !== prevProp.searchCode) {
            fetch("/getCompany",{
                method: "POST",
                cache: "no-cache",
                headers: {
                    "content-type":"application/json",
                },
                body: JSON.stringify(this.props.searchCode)
            })
            .then(response => {
                return response.json()
            })
            .then(json => {
                //On initialisation fetch a list of company names
                this.setState({
                    companyList: json,
                })
            })
        }
    }

    // Removes interval object to stop POST requests
    componentWillUnmount() {
        clearInterval(this.updateBetHistoryInterval);
        clearInterval(this.updateActiveInterval);
    }

    // A function that will be used to check whether a user's active bet session has passed
    // and needs to be updated in the bet_history and betting table, this function will be run
    // everyone 1 minute to check and update if necessary.
    updateActiveBet() {
        const user = this.cookie.get('user');

        if(user !== undefined) {
            fetch("/updateActiveBet",{
                method: "POST",
                cache: "no-cache",
                headers: {
                    "content-type":"application/json",
                },
                body: JSON.stringify(user)
            })
            .then(response => {
                return response.json()
            })
            .then(json => {
            })
        }

    }

    // Updates or Fetch User's Bet History
    updateBetHistory() {
        const user = this.cookie.get('user');
        // Gets user active bet list
        if(user !== undefined) {
            fetch("/getBetHistory",{
                method: "POST",
                cache: "no-cache",
                headers: {
                    "content-type":"application/json",
                },
                body: JSON.stringify(user)
            })
            .then(response => {
                return response.json()
            })
            .then(json => {
                // On initialisation fetch list of bet history for current user
                this.setState({
                    betList: json
                })
            })
        }
    }

    // Updates the state to open the betting modal by triggering a re-render
    // TriggerChange is important as we need to use it as a trigger condition for
    // componentDidUpdate() in betting_modal.jsx otherwise it will result in an infinite loop.
    // If we use stock code as a prop for the trigger condition componentDidUpdate() in betting_modal.jsx we won't
    // be able to use it to tell the function that we want to open the same modal again after closing it
    // therefore only allowing us to display the modal for one stock only once and after you close it and if you 
    // want to open it again you need to open a different stock modal beause the trigger to display a modal 
    // will only display if your current props stock code is unique from the previous one, i.e if(this.props.code != prevProps.code).
    // Therefore triggerChange is an important state variable and necessary in this case.
    handleShow(name) {
        this.setState({
            code: name,
            triggerChange: !this.state.triggerChange
        })
    }

    render() {
        let company_list = null 
        let bet_hist = null
        const user = this.cookie.get('user');
        let notLoggedIn = <div className="Login-error"style={{textAlign:"center",fontWeight: "bold"}}>You are not logged in, Please login to access registered features!</div>

        if(this.state.companyList !== null && user !== undefined) {
            company_list = this.state.companyList.map(obj =>
                <tr key={obj.key}>
                    <th scope="row">{obj.id}</th>
                    <td>{obj.name}</td>
                    <td>{obj.code}</td>
                    <td>
                        <button className="btn btn-outline-dark btn-sm w-75" style={{display: (obj.key === "no_bet_key") ? "none" : "block"}}
                        onClick={() => this.handleShow(obj.code)}>Bet</button>
                    </td>
                </tr>
            )
        }

        if(this.state.betList !== null && user !== undefined) {
            bet_hist = this.state.betList.map(obj =>
                <tr key={obj.key}>
                    <th scope="row">{obj.id}</th>
                    <td>{obj.code}</td>
                    <td>${obj.amount}</td>
                    <td className={(obj.reward < 0) ? "text-danger" : "text-success"}>{(obj.reward >= 0) ? "+" : "-"}${Math.abs(obj.reward)}</td>
                    <td>
                        <span className={`badge badge-pill ${(obj.status === "active") ? "badge-success" : "badge-warning"}`}>{obj.status}</span>
                    </td>
                </tr>
            )
        }

        if(user === undefined) {
            let unavailable = <span className="badge badge-warning">N/A</span>
            company_list = (
                <tr key="No_User_CL">
                    <th scope="row"></th>
                    <td>{notLoggedIn}</td>
                    <td/>
                    <td/>
                </tr>
            )

            bet_hist = (
                <tr key="No_User_BL">
                    <td >{notLoggedIn}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                    <td>{unavailable}</td>
                </tr>
            )
        }


        return (
            <div className="container-fluid w-100">
                <BetModal code={this.state.code} change={this.state.triggerChange}/>
                <table className="table table-striped">
                    <thead className="thead-dark">
                        <tr>
                            <th scope="col">{(user === undefined) ? null : "#"}</th>
                            <th scope="col">{(user === undefined) ? "Warning" : "Stock Name"}</th>
                            <th scope="col">{(user === undefined) ? null : "Stock Code"}</th>
                            <th scope="col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {company_list}
                    </tbody>
                </table>
                
                <table className="table mt-5 align-self-center">
                    <thead className="thead-light">
                        <tr>
                            <th scope="col">{(user !== undefined) ? "#" : "Warning"}</th>
                            <th scope="col">Stock Code</th>
                            <th scope="col">Bet Amount</th>
                            <th scope="col">Return</th>
                            <th scope="col">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bet_hist}
                    </tbody>
                </table>
                <div className="container-fluid w-100 mt-3">
                    <h6 style={{textAlign:"center"}}>{(user === undefined) ? null : "*Please note it takes a while for to show recently made bets"}</h6>
                </div>
            </div>
        );
    }
}
export default BetList;