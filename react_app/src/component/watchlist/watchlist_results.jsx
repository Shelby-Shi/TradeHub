import React, { Component } from "react"
import { Link } from "react-router-dom"
import WatchlistModal from "./watchlist_graph.jsx"

// child component for watchlist page
class WatchlistResults extends Component {

    constructor(props){
        super(props);
        this.state = {
            user: null,
            display: null,
            searchCode: '',
            code: null,
            change: false,
            name: null
        };
        this.componentDidMount = this.componentDidMount.bind(this)
        this.componentDidUpdate = this.componentDidUpdate.bind(this)
        this.handleRmWatchlist = this.handleRmWatchlist.bind(this)
        this.filterSearch = this.filterSearch.bind(this)
        this.handleGraphDisplay = this.handleGraphDisplay.bind(this);
    }

    // On loading, grab the user's watchlist from backend.
    // Add the watchlist info to the state
    componentDidMount() {
        fetch("/retrieveWatchlist",{
            method: "POST",
            cache: "no-cache",
            headers: {
                "content-type":"application/json",
            },
            body:JSON.stringify(this.props.user)
        })
        .then(response => {
            return response.json()
        })
        .then(json => {
            this.setState({
                user: this.props.user,
                display: json,
                searchCode: this.props.searchCode
            })
        })
    }

    // update search term state if it has changed
    componentDidUpdate(prevProp) {
        if(this.props.searchCode !== prevProp.searchCode){
            this.setState({
                searchCode: this.props.searchCode
            })
        }
    }

    // Case Insensitive filtering by making the searchTerm upper case,
    // As all company codes should be upper case anyways, 
    // Ensured stockCode upper case just in case for future use
    // If search term is default '' value, it just returns the entire thing
    filterSearch() {
        let arr = []
        var x
        const searchTerm = this.state.searchCode.toUpperCase()
        for (x in this.state.display) {
            const stockCode = this.state.display[x].code.toUpperCase()
            if (stockCode.includes(searchTerm)) {
                arr.push(this.state.display[x])
            }
        }
        return arr
    }

    // Updates the state.display when the user removes a stock from their watchlist
    // Remakes the display on a remove and updates the state numbers
    removeStock(code) {
        let arr = []
        var x
        let i = 1
        const toRemove = code.toUpperCase()
        var changed_display = this.state.display
        for (x in changed_display) {
            const stockCode = changed_display[x].code.toUpperCase()
            if (!stockCode.includes(toRemove)) {
                changed_display[x].id = i
                arr.push(changed_display[x])
                i = i + 1
            }
        }
        return arr
    }

    // POSTs to the backend to remove a code from the watchlist in the backend.
    // Call the removeStockfunction to handle removing in the frontend without impacting performance
    handleRmWatchlist(code) {
        // alert('f');return;
        const jsonToSend = {
          'user': this.props.user,
          'code': code
        }
        fetch("/rmFromWatchlist", {
            method: "POST",
            cache: "no-cache",
            headers: {
              "content_type": "application/json",
            },
            body: JSON.stringify(jsonToSend)
          }
        ).then(response => {
          return response.json()
        }).then(json => {
          //let newText = this.state.add
          if (json === true) {
            this.setState({
                user: this.props.user,
                display: this.removeStock(code),
                searchCode: this.props.searchCode
            })            
          }
        })
    }

    // handle the graph display
    handleGraphDisplay(code, comp_name) {
        this.setState({
            code: code,
            name: comp_name,
            change: !this.state.change
        })
    }

    render() {
        let list = null;
        let test = JSON.stringify(this.state.display)
        if(test==="[]" && this.state.user !== null){
            return (
                <div className="container-fluid w-100 d-flex flex-row justify-content-around">
                        <div className="noStocks">You're not watching any stocks</div>  
                </div>
            )
        } else {
            if(this.state.display !== null){
                // Calls the frontend search function.
                let filtered = this.filterSearch()
                list = filtered.map(obj =>
                    <tr key={obj.key}>
                        <th scope="row">{obj.id}</th>
                        <td>{obj.code}</td>
                        <td className={(obj.change < 0) ? "text-danger" : "text-success"}>{obj.change}%</td>
                        <td>${obj.close}</td>
                        <td>
                            <button className='btn btn-outline-dark btn-sm' onClick={() => this.handleGraphDisplay(obj.code, obj.name)} >Display Graph</button>
                        </td>
                        <td>
                            <Link className="btn btn-outline-dark btn-sm" style={{display: (obj.code === 0) ? "none" : "block"}}
                            to={{
                                pathname: "/details",
                                state: {
                                    name: obj.name,
                                    code: obj.code
                                }
                            }}>View</Link>
                        </td>
                        <td>
                            <button className='btn btn-outline-dark btn-sm' onClick={()=>this.handleRmWatchlist(obj.code)}>Remove</button>
                        </td>
                    </tr>    
                )
            }
            return (
                <div>
                    <WatchlistModal name={this.state.name} code={this.state.code} change={this.state.change}/>
                    <table className="table table-striped">
                        <thead className="thead-dark">
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Code</th>
                                <th scope="col">Daily Change</th>
                                <th scope="col">Latest Unit Price</th>
                                <th scope="col">Market Performance</th>
                                <th scope="col">Stock Page</th>
                                <th scope="col"></th>
                            </tr>
                        </thead>

                        <tbody>
                            {list}
                        </tbody>
                    </table> 
                </div>
            )
        }  
    }

}
export default WatchlistResults;

