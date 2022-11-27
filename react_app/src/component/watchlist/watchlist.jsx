import React, { Component } from "react"
import Navbar from "../global/navbar"
import WatchlistResults from "./watchlist_results"
import Cookies from 'universal-cookie';

// watchlist parent page
class Watchlist extends Component {

    constructor(){
        super();

        this.state = {
            user: null,
            searchTerm: '',
            fullSearch: '',
            display: null
        };
        this.cookies = new Cookies();
        this.componentDidMount = this.componentDidMount.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    // on page loading, set username state
    componentDidMount() {
        const username = this.cookies.get('user')
        this.setState({user:username})
    }

    // update search field state as user types
    handleChange(e) {
        this.setState({
            searchTerm: e.target.value
        })
    }

    // update search term state when user submits
    handleSubmit() {
        this.setState({
            fullSearch: this.state.searchTerm
        })
    }    
    render() {
        let notLoggedIn = (this.state.user === undefined) ? <div className="Login-error"style={{textAlign:"center",fontWeight: "bold"}}>You are not logged in, Please login to access registered features!</div> : null;
        let username = (this.cookies.get('user') === undefined) ? null:this.cookies.get('user')
        return(
            <div>
                <Navbar />
                <div>
                    <h1 className="mt-5" style={{textAlign:"center"}}>Your Watchlist</h1>
                    <div className="container-fluid w-100 d-flex flex-row justify-content-around">
                        <div className="user-name">{this.state.user}</div>  
                    </div>
                </div>
                <div className="container-fluid w-50 mt-4">
                    <div className="input-group">
                        <input type="text" className="form-control" onChange={this.handleChange}placeholder="Search Stock Code"/>
                        <div className="input-group-append">
                            <button className="btn btn-outline-info" onClick={this.handleSubmit}>Search</button>
                        </div>
                    </div>  
                </div>
                <div className="container-fluid w-75 mt-4">
                    <WatchlistResults user={username} searchCode={this.state.fullSearch}/>
                    {notLoggedIn}
                </div>  
            </div>
        );
    }

}
export default Watchlist;
