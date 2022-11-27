import React, {Component} from 'react';
import Navbar from "../global/navbar";
import MainDisplay from "./mainDisplay";

// home page parent component
class Home extends Component {

    render() {
        return( 
            <div>
                <Navbar/>
                <MainDisplay/>
            </div>
        );
    }
}

export default Home;