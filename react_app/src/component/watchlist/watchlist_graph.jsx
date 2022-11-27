import React, { Component } from "react";
import { Modal } from "react-bootstrap";
import Cookies from 'universal-cookie';
import CanvasJSReact from '../../canvasjs.react';
import "../../css/watchlist/watchlistGraph.css";

var CanvasJSChart = CanvasJSReact.CanvasJSChart;

// graph modal child component for watchlist
class WatchlistModal extends Component {

    constructor(props) {
        super(props);
        this.state = {
            code: null,
            data: null,
            name: null,
            show: false,
        }

        this.cookie = new Cookies();
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.changeBorderColor = this.changeBorderColor.bind(this);
        this.sortInfo = this.sortInfo.bind(this);
        this.resetState = this.resetState.bind(this);
    }

    // on modal loading fetch market for data for a stock
    componentDidUpdate(prevProp, prevState) {
        if(this.props.change !== prevProp.change){
            this.setState({
                show: true,
                code: this.props.code,
                name: this.props.name
            })

            this.fetchDailyMarket(this.props.code)
        }

    }

    // send post request to get daily market data for a watchlist stock
    fetchDailyMarket(code) {
        if(code !== null) {
            const info = {
                user: this.cookie.get('user'),
                code: code 
            }
            fetch("/getDailyMarket",{
                method: "POST",
                cache: "no-cache",
                headers: {"content-type":"application/json"},
                body: JSON.stringify(info)
            }).then(response=>{
                return response.json()
            }).then(json=>{
                const result = this.sortInfo(json)
                this.setState({
                    data: result
                })
            })
        }
    }

    // Sorts the fetched data and returns list of object that can be passed as dataPoints for data in option
    // in the render() function below, each object in the list is stored as 
    // { x: Datetime Object, y: [Open, High, Low, Close] }
    sortInfo(json) {
        var arr = []
        for(var x in json) {
            // x represents the timestamp
            // Converts the Unix Timestamp (in Milliseconds) into Datetime Object
            let currTime = new Date(0);
            currTime.setUTCMilliseconds(x);
            const date = currTime.getDate()
            const month = currTime.getMonth()
            const year = currTime.getFullYear()

            // json[x] fetches the dictionary stored with the timestamp/key of x
            const currInfo = json[x]
            let newObj = {
                x: new Date(year, month, date),
                y: [currInfo['Open'], currInfo['High'], currInfo['Low'], currInfo['Close']]
            }

            arr.push(newObj)
        }

        return arr
    }


    // This function modifies the default CanvasJS Border Color for each Data Points in the
    // dataSeries object in options
    changeBorderColor(options){
        var dataSeries;
        for( var i = 0; i < options.data.length; i++){
            dataSeries = options.data[i];

            // If our dataPoint is null, we don't do anything otherwise it will cause 
            // a null reading error
            if(dataSeries.dataPoints === null){
                break;
            }
            for(var j = 0; j < dataSeries.dataPoints.length; j++){
                dataSeries.dataPoints[j].color = (dataSeries.dataPoints[j].y[0] <= dataSeries.dataPoints[j].y[3]) ? (dataSeries.risingColor ? dataSeries.risingColor : dataSeries.color) : (dataSeries.fallingColor ? dataSeries.fallingColor : dataSeries.color);
            }
        }
    }

    // Function to reset modal field state
    resetState() {
        this.setState({
            show: false,
        })
    }


    render() {
        const options = {
            theme: "light2", 
            zoomEnabled: true,
			animationEnabled: true,
			exportEnabled: false,
			title:{
				text: ""
			},
			axisX: {
                interval: 1,
                intervalType: "day",
                valueFormatString: "YYYY-MM-DD",
                labelFontSize: 12,
                labelAngle: -45
			},
			axisY: {
				prefix: "$",
				title: "Price (in AUD)"
			},
			data: [{
				type: "candlestick",
				showInLegend: true,
                name: this.state.code,
                color: "#212F3D",
				yValueFormatString: "$###0.0000",
                xValueFormatString: "YYYY-MM-DD",
                risingColor: "#58D68D",
			    fallingColor: "#E74C3C",
				dataPoints: this.state.data
			}
		  ]
        }
        
        this.changeBorderColor(options)

        return (
            <Modal show={this.state.show} onHide={this.resetState} backdrop="static" keyboard={false} dialogClassName="modalGraph-90vw">
                    <Modal.Header closeButton>
                        <Modal.Title>{this.state.name}</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <div className="container-fluid w-100">
                            <CanvasJSChart options={options} onRef={ref => this.chart = ref}></CanvasJSChart>
                        </div>
                    </Modal.Body>

                    <Modal.Footer>
                        <button className='btn btn-outline-secondary' onClick={this.resetState}>Close</button>
                    </Modal.Footer>
                </Modal>
        );
    }
}
export default WatchlistModal