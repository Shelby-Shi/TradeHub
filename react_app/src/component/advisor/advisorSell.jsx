import React, { Component } from "react"
import Cookies from 'universal-cookie';
import { Modal } from "react-bootstrap";
import { Link } from "react-router-dom"

// Sell side of advisor page
class AdvisorSell extends Component{
    constructor(props){
        super(props);

        this.state = {
            user: null,
            stocks: [],//list of stocks with basic info
            show: false,//weather or not show the pop-up window
            err: false,// weather show the error msg
            err_msg: null,
            code:null,// current stock code
            quantity: undefined, // quantity of stock transaction
            price: 0,//price for the stock
            total: 0,//total price = price*quantity
            capital:0,//user capital
            currOwn:0,//current num of own
        };
        this.title = null;
        this.display = null;
        this.desc = null;
        this.placeholder = null;
        this.confirm = null;

        this.cookie = new Cookies()
        this.componentDidMount = this.componentDidMount.bind(this)
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
        this.updatePrice = this.updatePrice.bind(this);
        this.triggerModal = this.triggerModal.bind(this);
        this.triggerTransaction = this.triggerTransaction.bind(this);
        this.resetState = this.resetState.bind(this);
        this.handleDown = this.handleDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    // On page load, see if user is logged in, if so then get stocks to sell via POST
    componentDidMount() {
        const user = this.cookie.get('user');
        if (user !== undefined){
            fetch("/advisor_sell",{
                method: "POST",
                cache: "no-cache",
                headers: {
                    "content-type":"application/json",
                },
                body:JSON.stringify(user)
            })
            .then(response => {
                return response.json()
            })
            .then(json => {
                this.setState({
                    user: user,
                    stocks: json
                })
            })

            // Set interval to retrieve latest market price at interval of 1 minute
            this.getLatestPrice = setInterval(this.updatePrice, 60000);
        }
    }

    // Remove interval updating latest market price as page unloads
    componentWillUnmount() {
        clearInterval(this.getLatestPrice);
    }
    
    // Function to send a POST request to get latest market price
    updatePrice() {
        // Don't run if code is not set
        if (this.state.code === null){
            return
        }

        // Otherwise POST request of stock code for the price
        const obj = {
            code: this.state.code,
            request: "price"
        };

        fetch("/quickFetch",{
            method: "POST",
            cache: "no-cache",
            headers: {
                "content-type":"application/json",
            },
            body: JSON.stringify(obj)
        })
        .then(response => {
            return response.json()
        })
        .then(json => {
            this.setState({
                price: json
            })
        });
    }

    // Displays the popup if meets requirements
    triggerModal(e){
        // Checks for user login, if invalid don't allow them to buy/sell 
        if(this.cookie.get('user') === undefined){
            return
        }
        // Prepare contents for modal to display
        this.title = "Sell Request";
        this.placeholder = "How many to sell?";
        this.desc = "Total amount:";
        this.confirm = <button id="sell-confirm" className="btn btn-outline-primary" onClick={this.triggerTransaction}>Confirm Sale</button>

        // Double check user cookie, before showing
        const checkLogin = this.cookie.get('user')
        const company_code = e.target.id.substring(5,e.target.id.length)
        if(checkLogin !== undefined){
            const info = {
                user:this.state.user,
                stock:company_code
            }
            fetch("/getCapitalAndOwn",{
                method: "POST",
            cache: "no-cache",
            headers: {"content-type":"application/json"},
            body: JSON.stringify(info)
            }).then(response=>{
                return response.json()
            }).then(json=>{
                this.setState({
                    capital:json.capital,
                    currOwn:json.numOfOwn,
                    show: true,
                    code: company_code,
                },()=>{
                    this.updatePrice()
                })
            })
        }
    }

    // Perform sell operation
    triggerTransaction(e){
        const info = {
            email: this.cookie.get('user'),
            code: this.state.code,
            quantity: this.state.quantity,
            request: "sell",
        }

        // Post request containing user, code, quantity and sell order
        fetch("/transaction", {
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
            // Close modal on successful purchase/sell
            if(json.error === false){
                this.setState({
                    err: false,
                    show: false
                }, () => {
                    this.resetState();
                })
            }
            // Display error messages if applicable
            else if(json.error === true){
                this.setState({
                    err: true,
                    err_msg: json.err_msg
                })
            }
        });
    }

    // Function to reset modal field state
    resetState() {
        this.setState({
            code: null,
            show: false, 
            quantity: undefined, 
            err: false, 
            err_msg: null,
            price: 0,//price for the stock
            total: 0,//total price = price*quantity
            capital:0,//user capital
            currOwn:0,//current num of own
        })
    }

    // Key down event handler to prevent decimal values and exponential character
    handleDown(e) {
        if(e.key === '.' || e.key === 'e'){
            e.preventDefault();
        }
    }
    
    // Function to update the quantity as the user types
    handleChange(e) {
        this.setState({
            quantity: e.target.value,
            total: this.state.price * e.target.value
        })

    }

    render() {
        // On success, error messages are null;
        let error = (this.state.err === true) ? <small className="form-text text-danger mb-2">{this.state.err_msg}</small> : null;
        let notLoggedIn = (this.state.user === null) ? <div className="Login-error"style={{textAlign:"center",fontWeight: "bold"}}>You are not logged in, Please login to access registered features!</div> : null;
        let noStocks = (this.state.stocks.length === 0 && notLoggedIn === null) ? <div className="Stocks-error"style={{textAlign:"center",color: "red"}}>You should not sell any stocks/You do not own any stocks to sell</div> : null;
        // If there are stocks to sell, map to the table
        let list = null;
        if (noStocks === null){
            list = this.state.stocks.map(obj =>
                <tr key={obj.key}>
                    <th scope="row">{obj.id}</th>
                    <td>{obj.code}</td>
                    <td>{obj.name}</td>
                    <td className={(obj.change < 0) ? "text-danger" : "text-success"}>{obj.change}%</td>
                    <td><button id={"sell-"+obj.code} className='btn btn-outline-dark btn-sm' onClick={this.triggerModal}>Sell</button></td>
                    <td>
                            <Link className="btn btn-outline-dark btn-sm" style={{display: (obj.code === 0) ? "none" : "block"}} 
                            to={{
                                pathname: "/details",
                                state: {
                                    code: obj.code,
                                    name: obj.name
                                }
                            }}>View</Link>
                        </td>
                </tr>    
            )
        }
        return (
            <div>
                {/* Modal that pops up when clicking the buy button */}
                <Modal show={this.state.show} onHide={this.resetState} backdrop="static" keyboard={false} dialogClassName="modal-90w">
                    <Modal.Header closeButton>
                        <Modal.Title>{this.title}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <ul className="list-group">
                            <li className="list-group-item">
                                Stock Code: <span className="ml-2">{this.state.code}</span>
                            </li>
                            <li className="list-group-item">
                                Latest Market Price: <span className="ml-2">${this.state.price}</span>
                            </li>
                            <li className="list-group-item">
                                User Capital:  <span className="ml-2">${this.state.capital}</span>
                            </li>
                            <li className="list-group-item">
                                Currently Own:  <span className="ml-2">{this.state.currOwn}</span>
                            </li>
                        </ul>
                        <form className="container-fluid w-100 mt-3">
                            <div className="form-group">
                                <label>Enter Amount:</label>
                                {error}
                                <input type="number"  className="form-control" id="order-request" onKeyDown={this.handleDown} onChange={this.handleChange} placeholder={this.placeholder}></input>
                                <label className="mt-3">{this.desc} ${this.state.total}</label>
                            </div>
                        </form>
                    </Modal.Body>

                    <Modal.Footer>
                        <button className='btn btn-outline-secondary' onClick={this.resetState}>Close</button>
                        {this.confirm}
                    </Modal.Footer>
                </Modal>
                {/* End of modal code */}
                {/* <AdvisorModal user = {this.state.user} code={this.state.code} request='buy'/> */}
                {/* Table containing mapped fields */}
                <table className="table table-striped">
                <thead className="thead-dark">
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Code</th>
                        <th scope="col">Name</th>
                        <th scope="col">Daily Change</th>
                        <th scope="col"></th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
                    {list}
                </tbody>
                </table>
                {/* Error messages to display if applicable */}
                {notLoggedIn}
                {noStocks}
            </div>
        )
    }
}

export default AdvisorSell;