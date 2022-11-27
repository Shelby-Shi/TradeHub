import React, { Component } from "react"
import { Link } from "react-router-dom"
import Cookies from "universal-cookie";
import Navbar from "../global/navbar";
import ChangePassword from "./change_password.jsx"
import "../../css/account/accountPage.css"

// User account page
class Account extends Component {
    constructor(props){
        super(props);
        this.state = {
            funds: 0,
            gains: 0,
            revenue: 0,
            user: '',
        }
        this.cookie = new Cookies();
        this.componentDidMount = this.componentDidMount.bind(this);
    }

    // Fetch the user's capital and gains from /accountGains
    // Update the state.
    componentDidMount() {
        const user = this.cookie.get('user')
        if (user !== undefined) {
            const info = {
                user: this.cookie.get('user')
            }
            fetch("/accountGains",{
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
                    funds: json['fund'],
                    gains: json['gain'],
                    revenue: json['revenue'], 
                    user: user
                })
            })
        }
    }

    // adds thousands separators, dollar signs and negative signs if needed
    // returns a string
    simplifier(value){
        let simplified;
        simplified = (Math.abs(value)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (value < 0) {
            simplified = '-$' + simplified
        } else {
            simplified = '$' + simplified
        }
        return simplified
    }

    render() {
        let gains = this.simplifier(this.state.gains)
        let capital = this.simplifier(this.state.funds)
        let revenue = this.simplifier(this.state.revenue)
        return (
            <div>
                <Navbar />
                <div id='welcome'>
                    <u> Welcome to your account: {this.state.user} </u>
                </div>
                <div className="container-fluid d-flex flex-row w-75">
                    <div className="container-fluid d-flex flex-column align-items-center reg-form">
                        <h3 style={{textAlign:"center"}}>Account Details</h3>
                        <div id='wallet'>Capital: {capital}</div>
                        <div id='wallet'>Holdings: {revenue}</div>
                        <div id='gains'>Total Gains: {gains}</div>
                        <Link className='btn btn-lg btn-outline-dark mt-4 w-50' 
                            key='closeAccount' to='/closeAccount'>Close Account</Link>
                    </div>
                    <ChangePassword />
                    
                </div>
            </div>
        );
    }
}
export default Account;

