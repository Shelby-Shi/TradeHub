import React, { Component } from "react";
import { Link } from "react-router-dom"
import links from "./links.js";
import Cookies from 'universal-cookie';

// Need jquery to run collapse jquery from bootstrap
import "../../../node_modules/jquery/dist/jquery.min.js";
import "../../../node_modules/bootstrap/js/src/collapse.js";
import "../../css/global/navbar.css";

// navbar component that is included on most pages
class Navbar extends Component {
    constructor(props) {
        super(props);
        this.state = {
            text: "Login",
            route: "/login",
            text2: "Sign Up",
            route2: "",
            user: null
        };

        this.cookies = new Cookies();
        //Event handler functions gets bind here
        this.componentDidMount = this.componentDidMount.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    // Handles clicking of the login/logout button
    // If the user wants to logout, changes the login/logout button to login
    // changes the 'my account' button to 'sign up'
    handleChange() {
        if(this.state.text === "Logout") {
            this.cookies.remove('user');
            this.setState({
                text: "Login",
                route: "/login",
                text2: "Sign Up",
                route2: "/register",
                user: null
            })
        }

    }
    // Sets buttons based on cookies.
    // If user isn't logged in: buttons are 'login' and 'sign up'
    // If user is logged in: buttons are 'logout' and 'my account'
    componentDidMount() {
        fetch("/getCookie",{
            method: "GET",
            cache: "no-cache",
            headers: {
                "content-type":"application/json",
            },
        })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if(json.user !== null){
                const username = this.cookies.get('user')
                this.setState({
                    text: "Logout",
                    route: "/login",
                    text2: "My Account",
                    route2: "/account",
                    user: username
                })
            } else {
                this.setState({
                    text: "Login",
                    route: "/login",
                    text2: "Sign Up",
                    route2: "/register",
                    user: null
                })
            }
        })
    }


    // Animation for navbar at smaller windows
    animate() {
        //const currStyle = document.getElementById('hamburger').className;
        const newStyle = this.state.open === false ? 'change hamburger' : "hamburger";
        document.getElementById('hamburger').className = newStyle;
        this.setState({open: !this.state.open});
    }

    render() {
        const list = links.map(obj => 
            <li className="nav-item ml-1" key={obj.id} >
                <Link className="nav-link" style={{fontSize: "1.2em"}} to={obj.link}>
                    {obj.description}
                </Link>
            </li>)


        // We need to set <h6> or any header to display inline manually because all headings are block level,
        // and a block-level element occupies the entire space of its parent element (container)
        return (
            <nav className="navbar static-top navbar-expand-lg navbar-custom">
                <Link className="navbar-brand ml-2" style={{color:"white", fontSize:"1.9em"}} key="company-name" to={links[0].link}>TradeHub</Link>
                <div id="hamburger" onClick={() => this.animate()} className="hamburger" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <div className="bar1"></div>
                    <div className="bar2"></div>
                    <div className="bar3"></div>
                </div>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav mr-auto" style={{backgroundColor: "none"}}>
                        {list}
                    </ul>
                    
                    <span className="navbar-text" style={{backgroundColor: "none"}}>
                        <h6 className="ml-2 mr-2" style={{display: "inline"}}>{this.state.user}</h6>
                        <Link className="btn btn-outline-* ml-2 my-2 my-sm-0 setup" key="accountRegister" to={this.state.route2}>{this.state.text2}</Link>
                        <Link className="btn btn-outline-* ml-1 my-2 my-sm-0 setup" key="login" onClick={this.handleChange} to={this.state.route}>{this.state.text}</Link>
                    </span>

                </div>
            </nav>
        );
    }
}
export default Navbar;


