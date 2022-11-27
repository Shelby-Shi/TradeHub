import React, { Component } from "react"
import "../../css/frontpage/mainDisplay.css"

/* Image Imports */
import banner from "../../img/frontpage/banner.jpg"

// front page
class MainDisplay extends Component {

    render() {
        return (
            <div className="banner-div">
                <div style={{position:"relative"}}>
                    <div id="overlay">
                        <h1>Welcome to TradeHub</h1>
                    </div>
                    <img src={banner} className="banner-img" alt="Stock"></img>
                </div>
                <div className="mt-4 container-fluid w-100 d-flex flex-column ustify-content-center">
                    <h3 className="mt-2" style={{textAlign: "center"}}>What is TradeHub?</h3>
                    <div className="align-self-center w-50">
                        <p style={{textAlign: "center"}}>
                            We offer users and customers the opportunity to experience real-world stock market trading through
                            our virtual stock market trading simulation game. The virtual stock market data is provided by an API
                            that returns the real stock market data allowing us to keep the experience as close to the real world as 
                            possible. Additionally, we also offer additional entertainment features to allow you as the user to have 
                            fun as well!
                        </p>
                    </div>
                </div>
            </div>
        )
    }
}

export default MainDisplay;