import React, { Component } from "react"
import { Link } from "react-router-dom"
import Cookies from "universal-cookie";

// Delete account page
class DeleteAccount extends Component {
    constructor(props){
        super(props);
        this.state = {
        	user: '',
            pass: '',
            repPass: '',
            err: null,
            success: false
        }
        this.cookie = new Cookies();
        this.componentDidMount = this.componentDidMount.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.redirectHome = this.redirectHome.bind(this);
    }

    // Check logged in
    componentDidMount() {
        const user = this.cookie.get('user')
        if (user !== undefined) {
            this.setState({
                user: user
            })
        }
    }

    // Update state of fields when typing
    handleChange(e) {
        if(e.target.id === "pass"){
            this.setState({
                pass: e.target.value
            })
        } 
        else if(e.target.id === "repPass"){
            this.setState({
                repPass: e.target.value
            })
        }
    }

    // Change props history to move back to homepage 
    redirectHome(){
        this.props.history.push('/')
    }

    // On submission send a POST HTTP Request 
    onSubmit(e) {
        e.preventDefault();
        // Check if user is logged in
        if (this.state.user === ''){
            return
        }
        // Prepare POST body
        const info = {
            "user": this.state.user,
            "password": this.state.pass,
            "repeatPass": this.state.repPass,
        }
        // Perform POST to remove account
        fetch("/removeAccount",{
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
                err: json,
                success: json['success']
            }, 
            // If successful, remove cookie and reroute after 5 sec
            () => {
                if (this.state.success === true) {
                    this.cookie.remove('user');
                    setTimeout(this.redirectHome, 5000)
                }
            })
        })
    }

    render() {
        let passErr = (this.state.err === null) ? null: <small className="form-text text-danger mb-2">{this.state.err['passErr']}</small>;
        let passRepErr = (this.state.err === null) ? null: <small className="form-text text-danger mb-2">{this.state.err['passRepErr']}</small>;
        let successMessage = (this.state.success === false) ? null : <h4 className="form-text text-success mb-2" style={{textAlign:"center"}}>Account deleted, redirecting home in 5 seconds</h4>
        let logErr = (this.state.user !== '') ? null : <h4 className="text-danger mt-2" style={{textAlign:"center"}}>You are not logged in, cannot use this feature.</h4>
        return (
            <div className="container-fluid w-50">
                <form className="reg-form rounded">
                    <h3 style={{textAlign:"center"}}>Do you really wish to delete your account?</h3>
                    {logErr}
                    {successMessage}

                    <div className="form-group">
                        <label>Password</label>
                        {passErr}
                        <input id="pass" type="password" className="form-control" value={this.state.pass} onChange={this.handleChange}  placeholder="Password"/>
                        <small className="form-text text-muted">Please enter your password if you are sure you want to close your account.</small>
                    </div>

                    <div className="form-group">
                        <label>Repeat Password</label>
                        {passRepErr}
                        <input id="repPass" type="password" className="form-control" value={this.state.repPass} onChange={this.handleChange}  placeholder="Password"/>
                        <small className="form-text text-muted">Please repeat your password if you are sure you want to close your account.</small>
                    </div>

                    <div className="container-fluid mt-3 text-center">
                        <Link className='btn btn-success ml-4 px-4' key='cancel' to='/account'>Cancel</Link>
                        <button type="submit" className="btn btn-danger ml-4 px-4" onClick={this.onSubmit}>Submit</button>
                    </div>
                </form>
                <div className="mt-2" style={{textAlign:"center"}}>Disclaimer: This will delete all records linked to your account and cannot be reversed!</div>
            </div>
        );
    }
}
export default DeleteAccount;

