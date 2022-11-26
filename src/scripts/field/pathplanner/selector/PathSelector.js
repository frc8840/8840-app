import React from "react";
import Mover from "../../../mover/Mover.js";

import "./PathSelector.css";

const noneText = "None Selected";

class PathSelector extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            paths: [],
            selectedPath: ""
        };
    }

    getPaths() {
        const url = window.getRobotServerURL() + "/auto_path";

        fetch(url)
            .then((res) => res.json())
            .then((data) => {
                const newPaths = [noneText, ...data.files];
                this.setState({
                    paths: newPaths,
                    selectedPath: data.selected,
                });

                this.updatePaths.bind(this)();
            }
        );
    }

    async setPath(path) {
        const url = window.getRobotServerURL() + "/auto_path";

        const request = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                selection: path,
            }),
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
        for (let child of children) {
            if (Object.keys(child).includes("selected") && child.selected) {
                selected = child.innerText;
                break;
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
    }

    selectUpdate() {
        const select = document.getElementById("pathnames");

        this.setState({
            selectedPath: select.value,
        });
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
            <p>Selected Autonomous:</p>
            <select name="path" id="pathnames">
                <option value={noneText}>{noneText}</option>
            </select>
            <button onClick={this.getPaths.bind(this)}>Refresh</button>
            <br/>
            <button onClick={this.sendSelectedPath.bind(this)}>Set Selected Path</button>
        </div>);
    }
}

export default PathSelector;