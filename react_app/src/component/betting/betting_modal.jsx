import React, { Component } from "react"
import { Modal } from "react-bootstrap";
import Cookies from 'universal-cookie'

// modal for making a bet
class BetModal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            show: false,
            currCode: null,
            latest: 0,
            performance: 0,
            capital: 0,
            amount: 0,
            potential: 0,
            multiplier: 1.5,
            prediction: 1,
            err: false,
            err_msg: null
        }

        this.cookie = new Cookies();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleDown = this.handleDown.bind(this);
        this.resetState = this.resetState.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
    }

    // everytime there is an event, fetches latest data if it needs to
    componentDidUpdate(prevProp) {
        if(this.props.change !== prevProp.change){
            const info = {
                code: this.props.code,
                request: "bet",
                user: this.cookie.get('user')
            }
    
            fetch("/quickFetch",{
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
                this.setState({
                    show: true,
                    currCode: this.props.code,
                    latest: json.latest,
                    performance: json.performance,
                    capital: json.capital
                })
            })
        }
    
    }

    // Function to reset modal field state
    resetState() {
        this.setState({
            show: false,
            currCode: null,
            latest: 0,
            performance: 0,
            capital: 0,
            amount: 0,
            potential: 0,
            multiplier: 1.5,
            prediction: 1,
            err: false,
            err_msg: null
        })
    }


    // Processes the form requests, send a request with body containing
    // the user's email, stock code, user bet amount and reward multipler
    // to create an active bet for the user 
    handleSubmit() {
        const info = {
            email: this.cookie.get('user'),
            code: this.state.currCode,
            choice: this.state.prediction,
            amount: this.state.amount,
            mult: this.state.multiplier
        }

        fetch("/createBet",{
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
            if(json.valid) {
                this.resetState()
            }
            else {
                this.setState({
                    err: true,
                    err_msg: json.err_msg
                })
            }
        })
    }

    // Function to update the bet amount, reward multipler and also update
    // the potential reward display everytime the user types or selects a different
    // reward multipler
    handleChange(e) {
        if(e.target.id === 'bet-num'){
            const new_amount = parseFloat(e.target.value)
            this.setState({
                amount: new_amount,
                potential: new_amount * this.state.multiplier
            })
        }
        else if(e.target.id === 'bet-mult'){
            const new_mult = parseFloat(e.target.value)
            this.setState({
                multiplier: new_mult,
                potential: this.state.amount * new_mult
            })
        }
        else if(e.target.id === 'bet-pred'){
            const choice = parseFloat(e.target.value)
            this.setState({
                prediction: choice
            })
        }
    }

    // Key down event handler to prevent decimal values and exponential character
    handleDown(e) {
        if(e.key === 'e' || e.key === '-'){
            e.preventDefault();
        }
    }

    render() {
        let error = (this.state.err) ? <small className="text-danger form-text mb-2">{this.state.err_msg}</small> : null;

        return (
            <Modal show={this.state.show} onHide={this.resetState} backdrop="static" keyboard={false} dialogClassName="modal-90w">
                    <Modal.Header closeButton>
                        <Modal.Title>Challenge</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <ul className="list-group">
                            <li className="list-group-item">
                                Stock Code: <span className="ml-2">{this.state.currCode}</span>
                            </li>
                            <li className="list-group-item">
                                Latest Market Price: <span className="ml-2">${this.state.latest}</span>
                                </li>
                            <li className="list-group-item">
                                Stock Performance:  <span className={(this.state.performance > 0) ? "text-success ml-2" : "text-danger ml-2"}>{this.state.performance}%</span>
                            </li>
                            <li className="list-group-item">
                                User Capital:  <span className="ml-2">${this.state.capital}</span>
                            </li>
                            <li className="list-group-item">
                                <small className="form-text text-info">How to Play?</small>
                                <small>
                                    To start a bet, enter the amount to bet, select a reward multiplier and make a prediction to determine
                                    whether the stock price will increase or decrease after 1 week. <br/>
                                    Depending on your prediction, your capital value will increase
                                    on a win condition or decrease on a lose condition.
                                </small><br/>
                                <small className="text-warning">Note: You can only have one active betting game per user account running.</small>
                            </li>
                            <li className="list-group-item">
                                <small className="form-text text-info">Win Conditions:</small>
                                <small>
                                    On Success: <span className="text-success">Capital = Capital + Bet Amount * Selected Multiplier</span><br/>
                                    On Failure: <span className="text-danger">Capital = Capital - Bet Amount * Selected Multiplier * 2</span>
                                </small><br/>
                                
                            </li>
                        </ul>
                        <form className="container-fluid w-100 mt-3">
                            <div className="form-group">
                                {error}
                                <label>Enter Bet Amount:</label>
                                <input id="bet-num" type="number" onKeyDown={this.handleDown} onChange={this.handleChange} className="form-control" placeholder="Enter Amount to Bet"></input>

                                <label className="mt-3">Select Reward Multiplier:</label>
                                <select id="bet-mult" className="form-control" onChange={this.handleChange}>
                                    <option value="1.5">1.5x</option>
                                    <option value="2">2x</option>
                                    <option value="4">4x</option>
                                    <option value="10">10x</option>
                                </select>

                                <label className="mt-3">Prediction:</label>
                                <select id="bet-pred" className="form-control" onChange={this.handleChange}>
                                    <option value="1">Increase</option>
                                    <option value="0">Decrease</option>
                                </select>
                                <label className="mt-3">Potential Reward: ${this.state.potential}</label>
                            </div>
                        </form>
                    </Modal.Body>

                    <Modal.Footer>
                        <button className='btn btn-outline-primary' onClick={this.handleSubmit}>Submit Challenge</button>
                        <button className='btn btn-outline-secondary' onClick={this.resetState}>Close</button>
                    </Modal.Footer>
                </Modal>
        );
    }
}
export default BetModal