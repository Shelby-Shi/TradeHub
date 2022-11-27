import React, { Component } from "react"
import Cookies from "universal-cookie";
import { Modal } from "react-bootstrap";
import { Link } from "react-router-dom"

// Buy side of advisor page
class AdvisorBuy extends Component{
    constructor(props){
        super(props);

        this.state = {
            code: null,
            stocks: null,
            show: false,
            err: false,
            err_msg: null,
            quantity: undefined,
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

        this.cookie = new Cookies();

        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
        this.updatePrice = this.updatePrice.bind(this);
        this.triggerModal = this.triggerModal.bind(this);
        this.triggerTransaction = this.triggerTransaction.bind(this);
        this.resetState = this.resetState.bind(this);
        this.handleDown = this.handleDown.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    // Perform a get request of things to buy on load of page
    componentDidMount() {
        fetch('/advisor_buy', { 
            headers: {
                "content_type":"application/json",
            },
        })
        .then(response => response.json())
        .then(data => {
            this.setState({ 
                stocks: data
            })
        });
        
        // Set interval to retrieve latest market price at interval of 1 minute
        this.getLatestPrice = setInterval(this.updatePrice, 60000);
    }

    // Remove interval updating latest market price as page unloads
    componentWillUnmount() {
        clearInterval(this.getLatestPrice);
    }
    
    // Function to send a POST request to get latest market price
    updatePrice() {
        // Don't run if stock code is not set
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
        this.title = "Buy Request";
        this.placeholder = "How many to buy?";
        this.desc = "Total Cost:";
        this.confirm = <button id="buy-confirm" className="btn btn-outline-primary" onClick={this.triggerTransaction}>Confirm Purchase</button>
        
        // Double check user cookie, before showing
        const checkLogin = this.cookie.get('user')
        const company_code = e.target.id.substring(4,e.target.id.length)
        if(checkLogin !== undefined){
            const info = {
                user:this.cookie.get('user'),
                stock:company_code
            }
            // get current capital and owned currOwn of this stock
            fetch("/getCapitalAndOwn",{
                method: "POST",
            cache: "no-cache",
            headers: {"content-type":"application/json"},
            body: JSON.stringify(info)
            }).then(response=>{
                return response.json()
            }).then(json=>{
                this.setState({
                    price: json.price,
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

    // Perform buy operation
    triggerTransaction(e){
        const info = {
            email: this.cookie.get('user'),
            code: this.state.code,
            quantity: this.state.quantity,
            request: "buy",
        }
        // Post request containing user, code, quantity and buy order
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

        // Map stock details to the table
        let list = null;
        if(this.state.stocks !== null){
            list = this.state.stocks.map(obj =>
                <tr key={obj.key}>
                    <th scope="row">{obj.id}</th>
                    <td>{obj.code}</td>
                    <td>{obj.name}</td>
                    <td className={(obj.change < 0) ? "text-danger" : "text-success"}>{obj.change}%</td>
                    <td><button id={"buy-"+obj.code} className='btn btn-outline-dark btn-sm' onClick={this.triggerModal}>Buy</button></td>
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
                </div>
        )
    }
}

export default AdvisorBuy;