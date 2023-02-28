import React from "react";
import Mover from "../../../mover/Mover.js";

import "./PathSelector.css";

const noneText = "None Selected";

class PathSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            paths: [],
            modern_keys: [],
            selectedPath: "",
            robotCache: "",
            inLegacy: false,
        };
    }

    getPaths() {
        const url = window.getRobotServerURL() + "/auto/path";

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                const newPaths = [noneText, ...data.files];
                this.setState({
                    paths: newPaths,
                    selectedPath: data.selected,
                    robotCache: data.selected,
                });

                this.updatePaths.bind(this)();
            }
        ).catch((err) => {
            console.warn("PathSelector can't update legacy version. Is the robot server running?", err);
        });

        const url2 = window.getRobotServerURL() + "/get_registered_paths";

        fetch(url2)
            .then((res) => res.json())
            .then((data) => {
                this.setState({
                    modern_keys: data.paths,
                    selectedPath: data.selected_path,
                    robotCache: data.selected_path
                });
                
                this.updatePaths.bind(this)();
            }
        ).catch((err) => {
            console.warn("PathSelector can't update modern version. Is the robot server running?", err);
        });
    }

    async setPath(path) {
        const url = window.getRobotServerURL() + "/auto/path";

        const request = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(
                Object.assign({
                    selection: path,
                }, this.state.inLegacy ? {legacy: true} : {})
            ),
        });

        const response = await request.json();

        if (response.success) {
            if (Object.keys(this.props).includes("onPathChange")) this.props.onPathChange(path);

            this.getPaths();
        }
    }

    async sendSelectedPath() {
        const children = document.getElementById("pathnames").children;
        let selected = this.state.selectedPath;
        if (this.state.inLegacy) {
            for (let child of children) {
                if (Object.keys(child).includes("selected") && child.selected) {
                    selected = child.innerText;
                    break;
                }
            }
        }

        if (selected == noneText) {
            selected = "";
        }

        this.setPath.bind(this)(selected);
    }

    updatePaths() {
        const select = document.getElementById("pathnames");
        select.innerHTML = "";
        for (let path of this.state.paths) {
            const option = document.createElement("option");
            option.value = path;
            option.innerHTML = path;
            option.onclick = () => {
                this.setState({
                    "selectedPath": path,
                })
            }
            if (path === this.state.selectedPath) option.selected = true;
            select.appendChild(option);
        }

        const modern_select = document.getElementById("path_modern");
        modern_select.innerHTML = "";

        for (let key of this.state.modern_keys) {
            const option = document.createElement("option");
            option.value = key;
            option.innerHTML = key;
            option.onclick = () => {
                console.log("Selected path", key)
                this.setState({
                    "selectedPath": key,
                })
            }
            if (key === this.state.selectedPath) option.selected = true;
            modern_select.appendChild(option);
        }

        document.getElementById("pselector-robot-select").textContent = this.state.robotCache;

        if (this.state.modern_keys.length == 1) {
            this.setState({
                selectedPath: this.state.modern_keys[0],
            })
            console.log("Defaulting to path", this.state.selectedPath)
            if (this.state.selectedPath != null) {
                if (this.state.selectedPath == this.state.robotCache) return; //ignore if it's already selected
                

                //We'll run it quickly to update the robot since it's the only one
                this.setPath.bind(this)(this.state.selectedPath);
            }
        }
    }

    selectUpdate() {
        const select = document.getElementById("pathnames");

        this.setState({
            selectedPath: select.value,
        });
    }

    switchLegacy() {
        this.state.inLegacy = !this.state.inLegacy;

        const button = document.getElementById("pselector-switch-button");
        const legacy = document.getElementById("pselector-legacy");
        const modern = document.getElementById("pselector-modern");
        const legacyIndicator = document.getElementById("legacy-indicator");

        if (this.state.inLegacy) {
            button.innerHTML = "TO MODERN";
            legacy.style.display = "block";
            modern.style.display = "none";
            legacyIndicator.innerHTML = " (Legacy)";
        } else {
            button.innerHTML = "TO LEGACY";
            legacy.style.display = "none";
            modern.style.display = "block";
            legacyIndicator.innerHTML = "";
        }
    }

    componentDidMount() {
        document.getElementById("pathnames").addEventListener("change", this.selectUpdate.bind(this));

        this.getPaths.bind(this)();
    }

    componentWillUnmount() {
        document.getElementById("pathnames").removeEventListener("change", this.selectUpdate.bind(this));
    }

    render() {
        return (<div id="pselector-parent">
            <Mover target="pselector-parent"></Mover>
            <p>Selected Autonomous<span id="legacy-indicator"></span>:</p>
            <div id="pselector-modern">
                <p style={{fontSize: "14px"}}>Robot has selected: <span id="pselector-robot-select"></span></p>
                <select name="path_modern" id="path_modern">
                    <option value={noneText}>{noneText}</option>
                </select>
                <button onClick={this.getPaths.bind(this)}>Refresh</button>
                <br/>
                <button onClick={this.sendSelectedPath.bind(this)}>Set Selected Path</button>
            </div>
            <div id="pselector-legacy" style={{display: "none"}}>
                <select name="path" id="pathnames">
                    <option value={noneText}>{noneText}</option>
                </select>
                <button onClick={this.getPaths.bind(this)}>Refresh</button>
                <br/>
                <button onClick={this.sendSelectedPath.bind(this)}>Set Selected Path</button>
            </div>
            <br/><br/>
            <button id="pselector-switch-button" onClick={this.switchLegacy.bind(this)}>TO LEGACY</button>
        </div>);
    }
}

export default PathSelector;