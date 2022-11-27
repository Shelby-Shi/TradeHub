import React, { Component } from "react"
import Navbar from "../global/navbar"
import StockList from "./stock_list"

// stock search parent page
class StockSearch extends Component {
    constructor() {
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

    // update search term state when user submits
    handleSubmit() {
        this.setState({
            fullSearch: this.state.code
        })
    }

    render() {
        return(
            <div>
                <Navbar />
                <h1 className="mt-5" style={{textAlign:"center"}}>Company Directory</h1>

                <div className="container-fluid w-50 mt-4">
                    <div className="input-group">
                        <input type="text" className="form-control" onChange={this.handleChange} placeholder="Search for a company by name or code"/>
                        <div className="input-group-append">
                            <button className="btn btn-outline-info" onClick={this.handleSubmit}>Search</button>
                        </div>
                    </div>  
                </div>

                <div className="container-fluid w-75 mt-4">
                    <StockList searchCode={this.state.fullSearch}/>
                </div>
            </div>
        );
    }
}

export default StockSearch;