import React, { Component } from "react";
import CanvasJSReact from '../../canvasjs.react';

var CanvasJSChart = CanvasJSReact.CanvasJSChart;

// stock graph child component
class StockGraph extends Component {

    constructor(props) {
        super(props);
        this.state = {
            code: null,
            data: null
        }

        this.updateInterval = null;
        this.componentDidMount = this.componentDidMount.bind(this);
        this.componentDidUpdate = this.componentDidUpdate.bind(this);
        this.componentWillUnmount = this.componentWillUnmount.bind(this);
        this.fetchLiveMarket = this.fetchLiveMarket.bind(this);
        this.changeBorderColor = this.changeBorderColor.bind(this);
        this.sortInfo = this.sortInfo.bind(this);
    }

    // Fetch live market data on page loading
    componentDidMount() {
        if(this.props.code !== null) {
            this.setState({
                code: this.props.code
            }, this.fetchLiveMarket(this.props.code))

            // Interval function to update the live market graph every 5 minutes
            this.updateInterval = setInterval(() => this.fetchLiveMarket(this.state.code), 60000);
        }

    }

    // Fetch live market data on page refresh
    componentDidUpdate(prevProp, prevState) {
        if(this.props.code !== prevProp.code) {
            this.setState({
                code: this.props.code
            })
            this.fetchLiveMarket(this.props.code)
        }
    }

    // remove interval timer on page closing
    componentWillUnmount() {
        clearInterval(this.updateInterval);
    }


    // Function to fetch latest market data
    fetchLiveMarket(code) {
        if(code !== null) {
            fetch("/getLiveMarket",{
                method: "POST",
                cache: "no-cache",
                headers: {"content-type":"application/json"},
                body: JSON.stringify(code)
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

            // json[x] fetches the dictionary stored with the timestamp/key of x
            const currInfo = json[x]
            let newObj = {
                x: currTime,
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
                interval: 10,
                intervalType: "minute",
                valueFormatString: "HH:mm",
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
                xValueFormatString: "HH:mm",
                risingColor: "#58D68D",
			    fallingColor: "#E74C3C",
				dataPoints: this.state.data
			}
		  ]
        }
        
        this.changeBorderColor(options)
        return (
            <div className="container-fluid w-75">
                <CanvasJSChart options={options} onRef={ref => this.chart = ref}></CanvasJSChart>
            </div>
        )
    }
}
export default StockGraph;