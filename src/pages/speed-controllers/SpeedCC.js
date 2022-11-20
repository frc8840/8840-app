import React from "react";
import nt from "../../scripts/misc/nt";

import "./SpeedCC.css"
import Canvas from "../../scripts/canvas/Canvas";
import Mover from "../../scripts/mover/Mover";

const SpeedControllerTabName = "SpeedControllers";

class SpeedCC extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            speedControllers: [],
        }
    }

    async componentDidMount() {
        window.pause = false;

        let ntAwake = await nt.ping();
        let redo = true;
        if (ntAwake) {
            redo = !(await this.getSpeedControllers(false));
        }

        if (redo && !window.pause) {
            setTimeout(this.getSpeedControllers.bind(this), (window.nt || {timeoutPeriod: 10000}).timeoutPeriod);
        }
    }

    async getSpeedControllers(doTimeout=true) {
        const tabs = await nt.getTabsOrKeys();

        if (tabs.includes(SpeedControllerTabName)) {
            //TODO: Setup ws on the server to send speed controllers to the client.
            //Also make it a lot faster

            const keys = await nt.getTabsOrKeys(SpeedControllerTabName);
            const speedControllers = await Promise.all(keys.map(async (key) => {
                const speedController = await nt.getNT(SpeedControllerTabName, key, "double");
                return {
                    key,
                    speedController,
                };
            }));
            console.log(speedControllers);
            this.setState({
                speedControllers,
            });
        } else {
            console.warn("No speed controllers found yet. Waiting for one to be added...");
            if (doTimeout) {
                setTimeout(this.getSpeedControllers.bind(this), (window.nt || {timeoutPeriod: 10000}).timeoutPeriod);
            }
            return false;
        }

        return true;
    }
    
    draw(ctx) {

    }

    render() {
        return (
            <div id="cc-parent">
                <Mover target="cc-parent"></Mover>
                <Canvas id="cc" 
                    width={400} 
                    height={300} 
                    draw={this.draw.bind(this)}
                ></Canvas>
            </div>
        )
    }
}

export default SpeedCC;