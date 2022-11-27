import React, { Component } from "react"
import Navbar from "../global/navbar"
import AdvisorBuy from "./advisorBuy"
import AdvisorSell from "./advisorSell"

// Parent class that only holds components and page text
class Advisor extends Component{
    render() {
        return(
            <div>
                <Navbar />
                <div className="container-fluid w-75 mt-4">
                    {/* Buy side */}
                    <h1 className="mt-5" style={{textAlign:"center"}}>Your buy advice</h1>
                    <div style={{textAlign:"center"}}>Our investment advisor suggests you buy these stocks!</div>
                    <AdvisorBuy />
                    {/* Sell side */}
                    <h1 className="mt-5" style={{textAlign:"center"}}>Your sell advice</h1>
                    <div style={{textAlign:"center"}}>Our investment advisor suggests you consider sell these stocks!</div>
                    <AdvisorSell />
                    <div style={{textAlign:"center"}}>
                    <br/>
                    Disclaimer: Our advisor chooses a <b>random</b> selection of stocks to buy or sell. <br/>
                    This is based on studies that random investment strategies typically outperform strategies based on stock performance, and have reduced volatility, in the long term. <br/>
                    Link to a study analysing the effectiveness of random trade strategies: <a href='https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0068344'>https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0068344</a></div>
                </div>
            </div>
        );
    }
}
export default Advisor;