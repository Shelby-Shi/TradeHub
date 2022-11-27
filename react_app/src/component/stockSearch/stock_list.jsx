import React, { Component } from "react"
import { Link } from "react-router-dom"
import Cookies from 'universal-cookie';

// stock list child component
class StockList extends Component {

    constructor(props){
        super(props);
        this.state = {
            display: null,
        }

        this.cookie = new Cookies();
        this.initial = false
        this.handleSubmit = this.handleSubmit.bind(this);
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
    }

    // sends POST to get stocks based on search term
    componentDidMount() {
        fetch("/searchStock",{
            method: "POST",
            cache: "no-cache",
            headers: {
                "content-type":"application/json",
            },
            body: JSON.stringify(this.props.searchCode)
        })
        .then(response => {
            return response.json()
        })
        .then(json => {
            if(this.state.display === null) {
                this.setState({
                    display: json,
                })
            }
        })
    }
        
    // sends POST to get stocks based on search term on search code update
    componentDidUpdate(prevProp) {
        if(this.props.searchCode !== prevProp.searchCode){
            fetch("/searchStock",{
                method: "POST",
                cache: "no-cache",
                headers: {
                    "content-type":"application/json",
                },
                body: JSON.stringify(this.props.searchCode)
            })
            .then(response => {
                return response.json()
            })
            .then(json => {
                this.setState({
                    display: json
                })
            })
        }
    }
    //Sets stock code cookie for stock detail page
    handleSubmit(code) {  
        this.cookie.set('code', code)
    }

    render() {
        let list = null;
        
        if(this.state.display !== null){
            list = this.state.display.map(obj =>
                <tr key={obj.key}>
                    <th scope="row">{obj.id}</th>
                    <td>{obj.name}</td>
                    <td>{obj.code}</td>
                    <td className={(obj.change < 0) ? "text-danger" : "text-success"}>{obj.change}%</td>
                    <td>${obj.close}</td>
                    <td>
                        <Link className="btn btn-outline-dark btn-sm" style={{display: (obj.key === "empty_list_key") ? "none" : "block"}} to={{
                            pathname: "/details",
                            state: {
                                code: obj.code,
                                name: obj.name
                            }
                        }} onClick={() => this.handleSubmit(obj.code)}>View</Link>
                    </td>
                </tr>    
            )
        }
    
        return (
          <table className="table table-striped">
              <thead className="thead-dark">
                  <tr>
                      <th scope="col">#</th>
                      <th scope="col">Company Name</th>
                      <th scope="col">Code</th>
                      <th scope="col">5 Day Change</th>
                      <th scope="col">Latest Unit Price</th>
                      <th scope="col"></th>
                  </tr>
              </thead>

              <tbody>
                {list}
              </tbody>
          </table>  
        );
    }
}
export default StockList;