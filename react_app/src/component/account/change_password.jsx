import React, { Component } from "react"
import Cookies from "universal-cookie";
import "../../css/account/accountPage.css"

// change password component that fits into account page
class ChangePassword extends Component {
    constructor(props) {
        super(props);
        this.state = {
        	user: '',
            old_pass: '',
            new_pass: '',
            repeat_new_pass: '',
            old_pass_error: null,
            new_pass_error: null,
            new_pass_repeat_error: null
        }
        this.cookie = new Cookies();
        this.componentDidMount = this.componentDidMount.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    // Reset page settings on refresh
    componentDidMount() {
        const user = this.cookie.get('user')
        this.setState({
            user: user,
            old_pass: '',
            new_pass: '',
            repeat_new_pass: '',
            old_pass_error: null,
            new_pass_error: null,
            new_pass_repeat_error: null
        })
    }

    // Update new password/old password text fields values as the user types
    handleChange(e) {
        if(e.target.id === "oldPassword"){
            this.setState({
                old_pass: e.target.value
            })
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
    }

    // On submission send a POST HTTP Request 
    onSubmit(e) {
        e.preventDefault();
        const info = {
            "state": this.state,
            "loggedIn": true
        }
        fetch("/changePassword",{
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
                 	old_pass: '',
                    new_pass: '',
                    repeat_new_pass: '',
                    old_pass_error: '',
                    new_pass_error: '',
                    new_pass_repeat_error: ''
                 })
            }
            else {
                this.setState({
                	old_pass_error: json.oldPassError,
            		new_pass_error: json.newPassError,
            		new_pass_repeat_error: json.newPassRepError
            	})
            }
        })
    }


    render() {
        let successMessage = null
        if (this.state.old_pass_error === '' && this.state.new_pass_error === '' && this.state.new_pass_repeat_error === '') {
            successMessage = <h4 className="form-text text-success" style={{textAlign:"center"}}>Password Changed!</h4>
        }
        return (
            <div className="container-fluid d-flex justify-content-center">
                <form className="reg-form rounded">
                    <h3 style={{textAlign:"center"}}>Change Password</h3>
                    {successMessage}
                    <div className="form-group">
                        <label>Current Password</label>
                        <small className="form-text text-danger">{this.state.old_pass_error}</small>
                        <input id="oldPassword" type="password" className="form-control" value={this.state.old_pass} onChange={this.handleChange} placeholder="Current Password"/>
                        <small id="passwordHelp" className="form-text text-muted">Enter your current password.</small>
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
        );
    }
}
export default ChangePassword;