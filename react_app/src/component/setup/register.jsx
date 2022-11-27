import React, { Component } from "react"
import Navbar from "../global/navbar"
import { withRouter } from "react-router-dom"
import Cookies from 'universal-cookie';
import "../../css/setup/register.css"

// Register page
class Register extends Component {

    constructor() {
        super();
        this.state = {
            email: '',
            pass: '',
            pass_repeat: '',
            email_error: false,
            pass_error: false,
            pass_repeat_error: false,
            exist: false,
            securityQ: '',
            securityA: '',
            securityQError: false,
            securityAError: false
        };

        this.triggerPageChange = this.triggerPageChange.bind(this);
        this.triggerError = this.triggerError.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }


    // Reset page settings on refresh
    componentDidMount() {
        this.setState({
            email: '',
            pass: '',
            pass_repeat: '',
            email_error: false,
            pass_error: false,
            pass_repeat_error: false,
            exist: false,
            securityQ: '',
            securityA: '',
            securityQError: false,
            securityAError: false
        })
    }

    // Update email/password text field values as the user types
    handleChange(e) {
        if(e.target.id === "emailRegister"){
            this.setState({
                email: e.target.value
            })
        } 
        else if(e.target.id === "passwordRegister"){
            this.setState({
                pass: e.target.value
            })
        }
        else if(e.target.id === "passwordRegisterRepeat"){
            this.setState({
                pass_repeat: e.target.value
            })
        } 
        else if(e.target.id === "securityQ"){
            this.setState({
                securityQ: e.target.value
            })
        }
        else if(e.target.id === "securityA"){
            this.setState({
                securityA: e.target.value
            })
        }
    }

    // Trigger error messages on registration failure
    triggerError(obj) {

        // todo: switch error states?
        this.setState({
            email_error: !obj.emailRes,
            pass_error: !obj.passRes,
            pass_repeat_error: !obj.passRepeatRes,
            exist: obj.exist,
            securityQError: obj.securityQError,
            securityAError: obj.securityAError
        })
    }

    // Redirect user to account page on success registration
    triggerPageChange(capital) {
        const cookies = new Cookies();
        cookies.set("user", this.state.email, { path: '/' });
        this.props.history.push('/account',{capital: capital});
    }

    // On submission send a POST HTTP Request 
    onSubmit(e) {
        e.preventDefault();
        fetch("/registerCheck",{
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
            if(json.allowReg === true){
                this.triggerPageChange(json.capital);
            }
            else {
                this.triggerError(json);
            }
        })
    }


    render() {
        // Setup error messages if errors exist
        let exist_err = (this.state.exist) ? <p className="text-danger">Account Exist Already!</p> : null;
        let email_err = (this.state.email_error) ? <small className="form-text text-danger">Invalid Email!</small> : null;
        let pass_err = (this.state.pass_error === true && this.state.exist === false) ? <small className="form-text text-danger">Invalid Password!</small> : null;
        let pass_repeat_err = (this.state.pass_repeat_error === true && this.state.exist === false) ? <small className="form-text text-danger">Passwords do not match!</small> : null;
        let security_q_error = (this.state.securityQError === true && this.state.exist === false) ? <small className="form-text text-danger">Need a security question</small> : null;
        let security_a_error = (this.state.securityAError === true && this.state.exist === false) ? <small className="form-text text-danger">Need a security answer</small> : null;
        return (
            <div>
                <Navbar />
                {/* Register form */}
                <div className="container-fluid w-100 d-flex justify-content-center reg-box">
                    <form className="reg-form rounded">
                        <h1 style={{textAlign:"center"}}>REGISTER</h1>
                        {exist_err}
                        <div className="form-group">
                            <label>Email address</label>
                            {email_err}
                            <input id="emailRegister" type="email" className="form-control" value={this.state.email} onChange={this.handleChange} placeholder="Enter email"/>
                            <small id="emailHelp" className="form-text text-muted">We'll never share your email with anyone else.</small>
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            {pass_err}
                            <input id="passwordRegister" type="password" className="form-control" value={this.state.pass} onChange={this.handleChange}  placeholder="Password"/>
                            <small id="passwordHelp" className="form-text text-muted">Passwords must be minimum 8 characters, and up to 64 characters.</small>
                            <small id="passwordHelp" className="form-text text-muted">Special characters including emoji and Asian characters supported.</small>
                        </div>

                        <div className="form-group">
                            <label>Repeat Password</label>
                            {pass_repeat_err}
                            <input id="passwordRegisterRepeat" type="password" className="form-control" value={this.state.pass_repeat} onChange={this.handleChange}  placeholder="Repeat Password"/>
                            <small id="passwordHelp" className="form-text text-muted">Please repeat your password.</small>
                        </div>

                        <div className="form-group">
                            <label>Your Security Question</label>
                            {security_q_error}
                            <input id="securityQ" type="email" className="form-control" value={this.state.securityQ} onChange={this.handleChange}  placeholder="Security Question"/>
                            <small id="securityQHelp" className="form-text text-muted">Please enter your security question so you can recover your account.</small>
                        </div>

                        <div className="form-group">
                            <label>Your Security Answer</label>
                            {security_a_error}
                            <input id="securityA" type="email" className="form-control" value={this.state.securityA} onChange={this.handleChange}  placeholder="Security Answer"/>
                            <small id="securityAHelp" className="form-text text-muted">Please enter your security answer</small>
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
export default withRouter(Register);