import React from "react";
import SaveManager from "../../../save/SaveManager";

import "./PathSettings.css";

import Mover from "../../../mover/Mover";
import { Unit } from "../../../misc/unit";
import PID from "../../../pid/PID";

const defaults = {
    maxSpeed: new Unit(6, Unit.Type.FEET).get(Unit.Type.INCHES), //m/s
    minSpeed: new Unit(0.03 * 3, Unit.Type.METERS).get(Unit.Type.INCHES), //m/s
    maxAccel: new Unit(3, Unit.Type.INCHES).get(Unit.Type.INCHES), //m/s^2
    pid: new PID(0.075, 0.001, 0.3)
}

class PathSettings extends React.Component {

    constructor(props) {
        super(props);
        
        if (SaveManager.load("/pathsettings") == null) {
            SaveManager.save("/pathsettings", {
                maxSpeed: defaults.maxSpeed,
                minSpeed: defaults.minSpeed,
                maxAccel: defaults.maxAccel,
                pid: defaults.pid
            })
        }

        this.save = this.save.bind(this);
        this.reload = this.reload.bind(this);
    }

    save() {
        const P = parseFloat(document.getElementById("path-settings-pid-P").value);
        const I = parseFloat(document.getElementById("path-settings-pid-I").value);
        const D = parseFloat(document.getElementById("path-settings-pid-D").value);

        const maxSpeed = parseFloat(document.getElementById("path-settings-maxSpeed").value);
        const minSpeed = parseFloat(document.getElementById("path-settings-minSpeed").value);
        const maxAccel = parseFloat(document.getElementById("path-settings-maxAccel").value);

        SaveManager.save("/pathsettings", {
            maxSpeed: maxSpeed,
            minSpeed: minSpeed,
            maxAccel: maxAccel,
            pid: new PID(P, I, D)
        })

        console.log("Saved path settings!")

        this.reload();
    }

    reload() {
        const settings = SaveManager.load("/pathsettings");

        const P = settings.pid.p;
        const I = settings.pid.i;
        const D = settings.pid.d;

        const maxSpeed = settings.maxSpeed; // in/s
        const minSpeed = settings.minSpeed; //in/s
        const maxAccel = settings.maxAccel; //in/s(^2)

        document.getElementById("path-settings-pid-P").value = P;
        document.getElementById("path-settings-pid-I").value = I;
        document.getElementById("path-settings-pid-D").value = D;

        document.getElementById("path-settings-maxSpeed").value = maxSpeed;
        document.getElementById("path-settings-minSpeed").value = minSpeed;
        document.getElementById("path-settings-maxAccel").value = maxAccel;
    }

    componentDidMount() {
        this.reload();
    }

    render() {
        const P = 0;
        const I = 0;
        const D = 0;

        const maxSpeed = 0;
        const minSpeed = 0;
        const maxAccel = 0;

        return (
            <div id="path-settings-parent">
                <Mover target="path-settings-parent"></Mover>
                <div id="path-settings-content">
                    <h4>Path Settings</h4>
                    <label for="p">P</label><br/>
                    <input defaultValue={0} min={0} id="path-settings-pid-P" name="p" type="number" step={0.001} />
                    <br/>
                    <label for="i">I</label><br/>
                    <input defaultValue={0} type="number" id="path-settings-pid-I" name="i" step={0.001} />
                    <br/>
                    <label for="d">D</label><br/>
                    <input defaultValue={0} type="number" id="path-settings-pid-D" name="d" step={0.001} />
                    <br/>
                    <label for="maxSpeed">Max Speed (inches per second)</label><br/>
                    <input defaultValue={0} type="number" id="path-settings-maxSpeed" name="maxSpeed" step={0.01} />
                    <br/>
                    <label for="minSpeed">Min Speed (inches per second)</label><br/>
                    <input defaultValue={0} type="number" id="path-settings-minSpeed" name="minSpeed" step={0.01} />
                    <br/>
                    <label for="maxAccel">Max Acceleration (inches per second^2)</label><br/>
                    <input defaultValue={0} type="number" id="path-settings-maxAccel" name="maxAccel" step={0.01} />
                </div>
                <button onClick={this.save}>Save Changes</button>
            </div>
        )
    }
}

export default PathSettings;

export { defaults, PathSettings }