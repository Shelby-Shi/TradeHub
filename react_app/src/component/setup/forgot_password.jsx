import React, { Component } from "react"
import Navbar from "../global/navbar"

// forgot password page
class ForgotPassword extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: '',
            new_pass: '',
            repeat_new_pass: '',
            email_error: null,
            new_pass_error: null,
            new_pass_repeat_error: null,
            securityQ: '',
            securityA: '',
            securityAError: ''
        }
        this.componentDidMount = this.componentDidMount.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.retrieveQuestion = this.retrieveQuestion.bind(this);
    }

    // Reset page settings on refresh
    componentDidMount() {
        this.setState({
            email: '',
            new_pass: '',
            repeat_new_pass: '',
            email_error: null,
            new_pass_error: null,
            new_pass_repeat_error: null,
            securityQ: '',
            securityA: '',
            securityAError: ''
        })
    }

    // send POST request to get user's security question
    retrieveQuestion() {
        const email = this.state.email
        if (email.match(/(^[a-zA-Z0-9.+-_]+@[a-zA-Z0-9-]+\.[a-zA-Z.0-9-]+$)/) === null) {
            return
        }
        fetch("/getSecurity",{
            method: "POST",
            cache: "no-cache",
            headers: {
                "content-type":"application/json",
            },
            body: JSON.stringify(email)
        })
        .then(response => {
            return response.json()
        })
        .then(json => {
            this.setState({
                securityQ: json
            })
        })
    }

    // Update new password/old password text fields values as the user types
    handleChange(e) {
        if(e.target.id === "email"){
            this.setState({
                email: e.target.value
            }, () => this.retrieveQuestion())
        } 
        else if(e.target.id === "newPassword"){
            this.setState({
                new_pass: e.target.value
            })
        }
        else if(e.target.id === "newPasswordRepeat"){
            this.setState({
                repeat_new_pass: e.target.value
            })
        }
        else if(e.target.id === "securityAnswer"){
            this.setState({
                securityA: e.target.value
            })
        }
    }

    // On submission send a POST HTTP Request to handle a password change
    // or return errors if failed to change password
    onSubmit(e) {
        e.preventDefault();
        const info = {
            "state": this.state,
            "loggedIn": false
        }
        fetch("/forgotPassword",{
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
            if(json.allowChange === true){
                this.setState({
                    email: '',
                    new_pass: '',
                    repeat_new_pass: '',
                    email_error: '',
                    new_pass_error: '',
                    new_pass_repeat_error: ''
                 })
            }
            else {
                this.setState({
                    email_error: json.emailError,
                    new_pass_error: json.newPassError,
                    new_pass_repeat_error: json.newPassRepError,
                    securityAError: json.securityAError
                })
            }
        })
    }


    render() {
        let successMessage = null
        if (this.state.email_error === '' && this.state.new_pass_error === '' && this.state.new_pass_repeat_error === '' && this.state.securityAError === '') {
            successMessage = <h4 className="form-text text-success" style={{textAlign:"center"}}>Password Changed!</h4>
        }
        let securityQuestion = "Account not found"
        if (this.state.securityQ !== '') {
            securityQuestion = 'Security Question: '+ this.state.securityQ
        }
        return (
            <div>
                <Navbar />
                <div className="container-fluid d-flex justify-content-center">
                    <form className="reg-form rounded">
                        <h3 style={{textAlign:"center"}}>Forgot Password</h3>
                        {successMessage}
                        <div className="form-group">
                            <label>Email</label>
                            <small className="form-text text-danger">{this.state.email_error}</small>
                            <input id="email" type="email" className="form-control" value={this.state.email} onChange={this.handleChange} placeholder="Email"/>
                            <small id="passwordHelp" className="form-text text-muted">Enter your email.</small>
                        </div>
                        <div>
                             {securityQuestion} 
                        </div>
                        <div className="form-group">
                            <label>Security Answer</label>
                            <small className="form-text text-danger">{this.state.securityAError}</small>
                            <input id="securityAnswer" type="email" className="form-control" value={this.state.securityA} onChange={this.handleChange} placeholder="Security Answer"/>
                            <small id="SecAHelp" className="form-text text-muted">Enter your security answer.</small>
                        </div>
                        <div className="form-group">
                            <label>New Password</label>
                            <small className="form-text text-danger">{this.state.new_pass_error}</small>
                            <input id="newPassword" type="password" className="form-control" value={this.state.new_pass} onChange={this.handleChange}  placeholder="New Password"/>
                            <small id="passwordHelp" className="form-text text-muted">Enter your new password.</small>
                            <small id="passwordHelp" className="form-text text-muted">Passwords must be minimum 8 characters, and up to 64 characters.</small>
                            <small id="passwordHelp" className="form-text text-muted">Special characters including emoji and Asian characters supported.</small>
                        </div>

                        <div className="form-group">
                            <label>Repeat New Password</label>
                            <small className="form-text text-danger">{this.state.new_pass_repeat_error}</small>
                            <input id="newPasswordRepeat" type="password" className="form-control" value={this.state.repeat_new_pass} onChange={this.handleChange}  placeholder="New Password"/>
                            <small id="passwordHelp" className="form-text text-muted">Please repeat your new password.</small>
                        </div>


                        <div className="container-fluid mt-5 text-center">
                            <button type="submit" className="btn btn-success align-self-center" onClick={this.onSubmit}>Submit</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}
export default ForgotPassword;