import React, { Component } from "react"
import Navbar from "../global/navbar"
import BetList from "./betting_list.jsx"

// Betting page
class Betting extends Component {

    constructor(){
        super();
        this.state = {
            code: "",
            fullSearch: "",

        }
        this.handleChange = this.handleChange.bind(this)
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    // update search field state as user types
    handleChange(e) {
        this.setState({
            code: e.target.value
        })
    }

    // update search term state on submit
    handleSubmit() {
        this.setState({
            fullSearch: this.state.code
        })
    }


    render() {
        return (
            <div>
                <Navbar />
                <h1 className="mt-5" style={{textAlign:"center"}}>Betting Games</h1>
                <div className="container-fluid w-50 mt-4">
                    <div className="input-group">
                        <input type="text" className="form-control" onChange={this.handleChange} placeholder="Search for a company by name or code"/>
                        <div className="input-group-append">
                            <button className="btn btn-outline-info" onClick={this.handleSubmit}>Search</button>
                        </div>
                    </div>  
                </div>

                <div className="container-fluid w-75 mt-4">
                    <BetList searchCode={this.state.fullSearch}/>
                </div>

            </div>
        );
    }


}
export default Betting;