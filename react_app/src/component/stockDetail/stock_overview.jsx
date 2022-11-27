import React, { Component } from "react"
import Cookies from 'universal-cookie';

// Latest stat overview of a stock child component
class StockOverview extends Component {
    constructor(props) {
        super(props)
        this.state = {
            code: '',
            data:{
                cap: null,
                price: null,
                vol: null,
                numSh: null,
                annual: null,
                daily: null
            }
        }

        this.cookie = new Cookies();
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
    }

    // On page load/refresh, perform post request to fetch overview data
    componentDidMount() {
        if(this.state.code !== ''){
            fetch("/detailGrab", {
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
                    data: {
                        cap: json.cap,
                        price: json.price,
                        vol: json.vol,
                        numSh: json.numSh,
                        annual: json.annual,
                        daily: json.daily
                    }
                })
            })
        }

    }

    // On update of component, redo Post request
    componentDidUpdate(prevProp) {
        if(this.props.searchCode !== prevProp.searchCode){
            fetch("/detailGrab", {
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
                    data: {
                        cap: json.cap,
                        price: json.price,
                        vol: json.vol,
                        numSh: json.numSh,
                        annual: json.annual,
                        daily: json.daily
                    }
                })
            })
        }
    }


    // On leaving the page, remove price cookie
    componentWillUnmount() {
        this.cookie.remove("price");
    }

    // Helper function to display numbers in more user friendly manner
    simplifier(value){
        let simplified, symbol;
        if (value > 1000000000){
            simplified = Math.round(value/1000000000 * 100) / 100;
            symbol = 'Bn';
        } else if (value > 1000000){
            simplified = Math.round(value/1000000 * 100) / 100;
            symbol = 'M';
        } else if (value > 1000){
            simplified = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            symbol = null;
        }
        return {symbol: symbol, value: simplified}
    }

    render (){
        const data = this.state.data;
        let cap = this.simplifier(data.cap);
        let vol = this.simplifier(data.vol);
        let numSh = this.simplifier(data.numSh);
        return(
            <div className="table-responsive w-75" >
                {/* Table of info */}
                <table className='table'>
                    <thead className="thead-dark">
                        <tr>
                            <th>Attribute</th>
                            <th>Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Current Price</td>
                            <td>$ {data.price}</td>
                        </tr>
                        <tr>
                            <td>Volume</td>
                            <td>{vol.value} {vol.symbol}</td>
                        </tr>
                        <tr>
                            <td>Daily Performance</td>
                            <td>{data.daily} %</td>
                        </tr>
                        <tr>
                            <td>Annual Yield</td>
                            <td>{data.annual} %</td>
                        </tr>
                        <tr>
                            <td>Shares Outstanding</td>
                            <td>{numSh.value} {numSh.symbol}</td>
                        </tr>
                        <tr>
                            <td>Market Capitalisation</td>
                            <td>$ {cap.value} {cap.symbol}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    }
    
}

export default StockOverview;