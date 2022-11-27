import React, { Component } from "react"
import Cookies from 'universal-cookie';
import { Modal } from "react-bootstrap";

import "../../css/stockDetail/stock_button.css"

// buy/sell button child component
class TransactionButton extends Component {

    constructor(props) {
        super(props);

        this.state = {
            isLoggedIn: false, //Unused at the moment, future implementation
            show: false,
            err: false,
            err_msg: null,
            quantity: undefined,
            price: 0,
            code:null,// current stock code
            total: 0,//total price = price*quantity
            capital:0,//user capital
            currOwn:0,//current num of own
        }

        this.title = null;
        this.display = null;
        this.desc = null;
        this.placeholder = null;
        this.confirm = null;

        this.cookie = new Cookies();
        this.updatePrice = this.updatePrice.bind(this);
        this.resetState = this.resetState.bind(this);
        this.handleShow = this.handleShow.bind(this);
        this.handleDown = this.handleDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.triggerTransaction = this.triggerTransaction.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
    }

    componentDidMount() {
        // Initialise market price
        this.updatePrice();
        // Set interval to retrieve latest market price at interval of 1 minute
        this.getLatestPrice = setInterval(this.updatePrice, 60000);
    }

    // Remove interval updating latest market price as page unloads
    componentWillUnmount() {
        clearInterval(this.getLatestPrice);
    }

    // Function to trigger a buy or sell transaction
    triggerTransaction(e) {
        const info = {
            email: this.cookie.get('user'),
            code: this.cookie.get('code'),
            quantity: this.state.quantity,
            request: (e.target.id === "buy-confirm") ? "buy" : "sell",
        }

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
            if(json.error === false){
                this.setState({
                    err: false,
                    show: false // Close modal on successful purchase/sell
                }, () => {
                    this.resetState();
                })
            }
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
            show: false, 
            quantity: undefined, 
            err: false, 
            err_msg: null,
            total: 0
        })
    }

    // Function to send a POST request to get latest market price
    updatePrice() {
        const obj = {
            code: this.cookie.get('code'),
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


    // Function to trigger the display content for the BUY/SELL Modal
    handleShow(e) {
        // Checks for user login, if invalid don't allow them to buy/sell 
        if(this.cookie.get('user') === undefined){
            return
        }

        if(e.target.id === "buy-order"){
            this.title = "Buy Request";
            this.placeholder = "How many to buy?";
            this.desc = "Total Cost:";
            this.confirm = <button id="buy-confirm" className="btn btn-outline-primary" onClick={this.triggerTransaction}>Confirm Purchase</button>
        }
        else if(e.target.id === "sell-order"){
            this.title = "Sell Request";
            this.placeholder = "How many to sell?";
            this.desc = "Total Value:"
            this.confirm = <button id="sell-confirm" className="btn btn-outline-primary" onClick={this.triggerTransaction}>Confirm Sell</button>
        }

        const checkLogin = this.cookie.get('user')
        if(checkLogin !== undefined){
            const info = {
                user:this.cookie.get('user'),
                stock:this.cookie.get('code')
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
                    code: info.stock,
                }, () => {
                      this.updatePrice();
                })
            })
        }
    }


    // Function to update the quantity as the user types
    handleChange(e) {
        this.setState({
            quantity: e.target.value,
            total: (this.state.price * e.target.value).toFixed(2)
        })

    }

    // Key down event handler to prevent decimal values and exponential character
    handleDown(e) {
        if(e.key === '.' || e.key === 'e'){
            e.preventDefault();
        }
    }


    render() {
        //let success = null;
        let error = (this.state.err === true) ? <small className="form-text text-danger mb-2">{this.state.err_msg}</small> : null;

        return(
            <div className="container-fluid w-100">
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


                <div className="container-fluid d-flex flex-column w-100">
                    <button id="buy-order" className='btn btn-lg btn-outline-dark mt-1' onClick={this.handleShow}>Buy</button>
                    <button id="sell-order" className='btn btn-lg btn-outline-dark mt-1'onClick={this.handleShow}>Sell</button>
                </div>
            </div>
        );
    }
}

export default TransactionButton;