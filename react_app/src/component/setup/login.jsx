import React, { Component } from "react"
import Navbar from "../global/navbar"
import { Link } from "react-router-dom"
import Cookies from 'universal-cookie';
import "../../css/setup/login.css"

// Login page
class Login extends Component {

    constructor(props){
        super(props);

        this.state = {
            email: '',
            pass: '',
            invalid: false,
            attempts: 0,
            hide: "block",
        };

        this.timer = null;
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentWillUnmount = this.componentWillUnmount(this);
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.triggerLogin = this.triggerLogin.bind(this);
        this.triggerError = this.triggerError.bind(this);
    }

    // Reset page input fields on page refresh or first load.
    componentDidMount() {
        this.setState({
            email: '',
            pass: '',
            invalid: false,
            attempts: 0,
            hide: "block"
        })
    }

    // When leaving page, clear timeout timer
    componentWillUnmount() {
        clearTimeout(this.timer);
    }
    
    // If user exceeds maximum login attemps disable the user from attempting to login for a specific
    // amount of time, otherwise disable appropriate error message
    triggerError() {
        if(this.state.attempts > 2){
            this.setState({
                hide: "none"
            });

            // Set timer to allow reset state to allow to reattempt logging in
            this.timer = setTimeout(() => {
                this.setState({
                    email: '',
                    pass: '',
                    invalid: false,
                    attempts: 0,
                    hide: "block",
                })
            }, 10000)
        }
        else {
            this.setState({
                email: '',
                pass: '',
                invalid: true,
                attempts: this.state.attempts + 1
            })
        }
    }



    // Redirect user to account page on success registration 
    triggerLogin(capital) {
        const cookies = new Cookies();
        cookies.set("user", this.state.email, { path: '/'});
        this.props.history.push('/account',{capital: capital});
    }


    // Update email/password text field values as the user types
    handleChange(e) {
        // Check which element is calling function
        if(e.target.id === "emailLogin"){
            this.setState({
                email: e.target.value
            })
        }
        else if(e.target.id === "passwordLogin"){
            this.setState({
                pass: e.target.value
            })
        }
    }


    // On submission send a POST HTTP Request 
    onSubmit(e) {
        e.preventDefault();
        fetch("/loginCheck",{
            method: "POST",
            cache: "no-cache",
            headers: {
                "content-type":"application/json",
            },
            body: JSON.stringify(this.state)
        })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if(json.allowLogin) {
                this.triggerLogin(json.capital);
            }
            else {
                this.triggerError();
            }
        })
    }


    render() {
        // Error messages
        let invalid_err = (this.state.invalid === true && this.state.hide === "block") ? <p className="text-danger" style={{textAlign: "center"}}>Invalid Account Details</p> : null;

        // Login page form
        const form = (
            <div className="d-flex flex-column justify-content-center" style={{display: this.state.hide}}>
                {invalid_err}
                <div className="w-25 form-group align-self-center">
                    <label>Email address</label>
                    <input id="emailLogin" type="email" className="form-control" value={this.state.email} onChange={this.handleChange} placeholder="Enter email"/>
                </div>

                <div className="w-25 form-group align-self-center">
                    <label>Password</label>
                    <input id="passwordLogin" type="password" className="form-control" value={this.state.pass} onChange={this.handleChange} placeholder="Password"/>
                </div>

                <div className="container-fluid w-100 text-center mt-3">
                    <button type="submit" className="btn btn-success px-4" onClick={this.onSubmit}>Submit</button>
                    <Link className="btn btn-info ml-4 px-4" key="login" to="/register">Register</Link>
                    <Link className="btn btn-info ml-4 px-4" key="forgotPassword" to="/forgotPassword">Forgotten Password</Link>
                </div>

            </div>
        )
        // Prevent login if exceed max login attempts
        let display= (this.state.hide === "none") ? <p className="text-danger" style={{textAlign: "center"}}>You have Exceeded Max Login Attemps, Please Retry a Bit Later!</p>  : form;
        
        return (
            <div>
                <Navbar />
                <div className="container-fluid w-100 d-flex login-box" >
                    <form className="login-form rounded w-100">
                        <h1 style={{textAlign: "center"}}>LOGIN</h1>
                        {display}
                    </form>
                </div>
            </div>
        );
    }
}
export default Login;

