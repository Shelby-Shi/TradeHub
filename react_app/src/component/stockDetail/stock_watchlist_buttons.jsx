import React, {Component} from "react"
import Cookies from 'universal-cookie';

// watchlist button child component
class WatchlistButtons extends Component {
  constructor(props) {
    super(props)
    this.state = {
      text: '',
      watchingStock: false,
      add: 'Add to Watchlist',
      remove: 'Remove from Watchlist'
    }
    this.cookies = new Cookies();
    this.componentDidMount = this.componentDidMount.bind(this)
    this.componentDidUpdate = this.componentDidUpdate.bind(this)
    this.handleAddWatchlist = this.handleAddWatchlist.bind(this)
    this.handleRmWatchlist = this.handleRmWatchlist.bind(this)
    this.checkExist = this.checkExist.bind(this)
  }

  // check props.code on page loading
  componentDidMount() {
    if(this.props.code !== null) {
      this.checkExist()
    }
  }

  // check if props.code changes on refresh
  componentDidUpdate(prevProp) {
    if(this.props.code !== prevProp.code){
      this.checkExist()
    }
  }

  // send POST request to grab watchlist data and see if its already in the watchlist
  checkExist() {
    const username = this.cookies.get('user')
    const jsonToSend = {
      'user': username,
      'code': this.props.code
    }
    if (username === undefined) {
    	this.setState ({
    		text: this.state.add
    	})
    } else if (this.props.code !== '') {
      fetch("/checkStockWatchlist", {
          method: "POST",
          cache: "no-cache",
          headers: {
            "content_type": "application/json",
          },
          body: JSON.stringify(jsonToSend)
        }
      ).then(response => {
        return response.json()
      })
        .then(json => {
          let newText = this.state.add
          if (json === true) {
            newText = this.state.remove
            this.setState({
              text: newText,
              watchingStock: json
            })
          } else {
            newText = this.state.add
            this.setState({
              text: newText,
              watchingStock: json
            })
          }
        })
    }
  }

  // handle adding stock to the watchlist
  handleAddWatchlist() {
    const username = this.cookies.get('user')
    const jsonToSend = {
      'user': username,
      'code': this.props.code
    }
    if (username === undefined) {
    	this.setState ({
    		text: this.state.add
    	})
    } else { 
		fetch("/addToWatchlist", {
	        method: "POST",
	        cache: "no-cache",
	        headers: {
	          "content_type": "application/json",
	        },
	        body: JSON.stringify(jsonToSend)
	      }
	    ).then(response => {
	      return response.json()
	    })
	      .then(json => {
	        let newText = this.state.add
	        if (json === true) {
	          newText = this.state.remove
	          this.setState({
	            text: newText,
	            watchingStock: true
	          })
	        }
	      })
	   }
  }

  // handle a remove from the watchlist
  handleRmWatchlist() {
    const username = this.cookies.get('user')
    const jsonToSend = {
      'user': username,
      'code': this.props.code
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
      let newText = this.state.add
      if (json === true) {
        newText = this.state.add
        this.setState({
          text: newText,
          watchingStock: false
        })
      }
    })
  }

  render() {
    const {text, watchingStock} = this.state;
    return (
      <div className="container-fluid w-100">
        <div className="container-fluid d-flex flex-column w-100">
          <button className='btn btn-lg btn-outline-dark mt-1'
                onClick={watchingStock ? this.handleRmWatchlist : this.handleAddWatchlist}>{text}</button>
        </div>
      </div>
    );
  }
}

export default WatchlistButtons;
