import React from "react";
import nt from "../../scripts/misc/nt";
import './Hosting.css';

class Hosting extends React.Component {
    constructor(params) {
        super(params);
        this.state = {
            symbols: {
                connected: "🟢",
                connecting: "🟡",
                disconnected: "🔴",
            },
            status: "disconnected",
        }
        this.connectAndUpdateStatus = this.connectAndUpdateStatus.bind(this);
        this.updateEmoji = this.updateEmoji.bind(this);

        window.getRobotServerURL = () => {
            return "http://" + window.nt.host + ":" + window.nt.port;
        }
    }

    componentDidMount() {
        console.log("Trying to connect...")

        let defaultSettings = {
            host: "localhost",
            port: 8080,
            timeoutPeriod: 10000,
        };

        if (!window.nt) {
            window.nt = defaultSettings;
        }

        if (window.localStorage.getItem("nt")) {
            window.nt = Object.assign(defaultSettings, JSON.parse(window.localStorage.getItem("nt")));
        }

        this.updateNames();
        this.connectAndUpdateStatus();
    }

    async connectAndUpdateStatus() {
        const connectedBefore = this.state.status === "connected";

        this.setState({status: "connecting"});
        this.state.status = "connecting";
        this.updateEmoji();

        if (!!window.pause) return;

        const connected = await nt.ping();

        console.log(`Connected to server (Host: ${window.nt.host}, Port: ${window.nt.port})? ${connected}`);
        
        if (connected) {
            this.setState({status: "connected"});
            this.state.status = "connected";

            //if (!connectedBefore) nt.setupClient();
        } else {
            //nt.stopClient();
            this.setState({status: "disconnected"});
            this.state.status = "disconnected";
        }
        this.updateEmoji();

        if (nt.timeout) {
            clearTimeout(nt.timeout);
        }


        nt.timeout = setTimeout(this.connectAndUpdateStatus, window.nt.timeoutPeriod);
    }

    updateEmoji() {
        const status = this.state.status;
        const emoji = this.state.symbols[status];
        const emojiElement = document.getElementById("connection-status");
        emojiElement.innerText = " " + emoji;
    }
    
    updateNames() {
        const port = (window.nt || {port: 8080}).port
        const host = (window.nt || {host: "localhost"}).host;
        
        document.getElementById("port-display").innerText = port;
        document.getElementById("host-display").innerText = host;
    }

    changeDetails(type) {
        const newDetails = prompt("Enter new " + type + ":", (window.nt || {})[type]);
        if (newDetails) {
            window.nt[type] = type === "port" ? parseInt(newDetails) : newDetails;
            window.localStorage.setItem("nt", JSON.stringify(window.nt));
            this.updateNames();
            this.connectAndUpdateStatus();
        }
    }

    render() {
        return (
            <div className="hosting-parent">
                <div>
                    <p className="display-div">
                        <span className="display-gray">http://</span>
                        <span id="host-display" onClick={() => {this.changeDetails("host")}}></span>
                        <span className="display-gray">:</span>
                        <span id="port-display" onClick={() => {this.changeDetails("port")}}></span>
                        <span id="connection-status"> {this.state.symbols.disconnected}</span>
                    </p>
                </div>
            </div>
        );
    }
}

export default Hosting;