import React from "react";
import Mover from "../../mover/Mover";

import LogParser from "./LogParser";

import "./LoadLog.css";

class LoadLog extends React.Component {
    constructor(props) {
        super(props);

        window.log = new LogParser();

        this.state = {
            file: null,
        }
    }
    onLoad() {
        //Load the file
        const reader = new FileReader();

        reader.onload = (e) => {
            const text = e.target.result;
            
            window.log.load(text);

            console.log("Loaded log! Starting analysis...");
            window.log.analyze();
        }

        //check if the file exists
        if (this.state.file == null) {
            console.error("No file selected!");
            alert("You need to select a file!")
            return; 
        }

        reader.readAsText(this.state.file);
    }
    render() {
        return (
            <div id="load-log-parent">
                <Mover target={"load-log-parent"}></Mover>
                <div className="load-log">
                    <input type="file" accept=".baydat" onChange={(e) => {
                        this.setState({file: e.target.files[0]});
                    }
                    }/>
                    <button onClick={this.onLoad.bind(this)}>Load</button>
                </div>
            </div>
        );
    }
}

export default LoadLog;