import React, { Component } from "react"

// 5 day historical child component
class Historicals extends Component {
    constructor(props) {
        super(props)
        this.state = {
            code: '',
            data: null,
        }
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
    }

    // send POST request to grab 5-day data for a stock on page loading
    componentDidMount() {
        // perform post request to fetch data
        if(this.state.code !== ""){
            fetch("/historicalGrab", {
                method:"POST",
                cache: "no-cache",
                headers:{
                    "content_type":"application/json",
                },
                body:JSON.stringify(this.props.searchCode)
                }
            ).then(response => {
                return response.json()
            })
            .then(json => {
                this.setState({
                    code: this.props.searchCode,
                    data: json
                })
            })
        }
    }

    // send POST request to grab 5-day data for a stock on a refresh
    componentDidUpdate(prevProps){
        if(this.props.searchCode !== prevProps.searchCode){
            fetch("/historicalGrab", {
                method:"POST",
                cache: "no-cache",
                headers:{
                    "content_type":"application/json",
                },
                body:JSON.stringify(this.props.searchCode)
                }
            ).then(response => {
                return response.json()
            })
            .then(json => {
                this.setState({
                    code: this.props.searchCode,
                    data: json
                })
            })
        }
    }

    render (){
        let list = null;

        if(this.state.data !== null) {
            list = this.state.data.map(obj =>
                <tr key={obj.key}>
                    <td>{obj.date}</td>
                    <td>{obj.price}</td>
                    <td>{obj.low}</td>
                    <td>{obj.high}</td>
                    <td className={(obj.daily < 0) ? "text-danger" : "text-success"}>{obj.daily}%</td>
                    <td>{obj.volume}</td>
                </tr> 
            )
        }

        return(
            <table className='table w-75'>
                <thead className="thead-dark">
                    <tr>
                        <th>Date (Day-Month)</th>
                        <th>Price ($)</th>
                        <th>Low ($)</th>
                        <th>High ($)</th>
                        <th>Daily (%)</th>
                        <th>Vol</th>

                    </tr>
                </thead>
                <tbody>
                    {list}
                </tbody>
            </table> 
        );
    }
    
}

export default Historicals;