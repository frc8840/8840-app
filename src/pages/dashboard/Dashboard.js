import React from "react"
import { mdiArrowLeft, mdiArrowRight, mdiClose, mdiMenuDown, mdiMenuRight } from '@mdi/js';

import "./Dashboard.css"
import Icon from "@mdi/react";

import { defaults as ppDefaults } from "../../scripts/field/pathplanner/settings/PathSettings";
import SaveManager from "../../scripts/save/SaveManager";
import { Unit } from "../../scripts/misc/unit";
import PID from "../../scripts/pid/PID";

const emojis = {
    locked: "🔒",
    unlocked: "🔓"
}

window.generatedashboardsidebarcontentid = (function*() {
    let i = 0;
    while (true) {
        yield "dshbrd-sidebar-content-" + (i++);
    }
})();

class DashboardSidebarContent extends React.Component {
    constructor(props) {
        super(props);

        const savedData = JSON.parse(window.localStorage.getItem("dshmenus")) || {};

        let alreadyOpen = false;

        if (Object.keys(savedData).includes(this.props.title)) {
            alreadyOpen = savedData[this.props.title].open;
        }

        this.state = {
            title: Object.keys(props).includes("title") ? props.title : "Insert Title",
            open: alreadyOpen,
            id: window.generatedashboardsidebarcontentid.next().value,
        }

        this.doToggle = this.doToggle.bind(this);
        this.toggleContent = this.toggleContent.bind(this);
        this.saveStatus = this.saveStatus.bind(this);
    }

    toggleContent(open=false) {
        this.state.open = open;
        this.saveStatus();

        this.forceUpdate();
    }

    saveStatus() {
        let current = JSON.parse(window.localStorage.getItem("dshmenus")) || {};

        current[this.state.title] = {
            open: this.state.open
        }

        window.localStorage.setItem("dshmenus", JSON.stringify(current));
    }

    doToggle() {
        this.toggleContent(!this.state.open);
    }

    componentDidMount() {
        this.toggleContent(this.state.open);
    }

    render() {
        return (
            <div className="dashboard-sidebar-dropdown" id={this.state.id}>
                <div className="dashboard-sidebar-dropdown-title" onClick={this.doToggle}>
                    <div id={this.state.id + "-title-icon"}><Icon path={this.state.open ? mdiMenuDown : mdiMenuRight} size={1}/></div>
                    <span>{this.state.title}</span>
                </div>
                <div style={Object.assign({
                    height: this.state.open ? "auto" : "0",
                }, !this.state.open ? {
                    paddingTop: "0",
                    paddingBottom: "0",
                    border: "none"
                } : {})} className="dashboard-sidebar-dropdown-content">
                    {this.props.children}
                </div>
            </div>
        );
    }
}

class DashboardLockInput extends React.Component {
    constructor(props) {
        super(props);

        if (!Object.keys(props).includes("target")) {
            throw "No Target Provided in <DashboardLockInput/>"
        }

        let alreadyLocked = Object.keys(props).includes("defaultValue") ? props.defaultValue : false;

        let current = JSON.parse(window.localStorage.getItem("dshlocks")) || {};

        if (Object.keys(current).includes(props.target)) {
            alreadyLocked = current[props.target].locked;
        }

        this.state = {
            target: props.target,
            locked: alreadyLocked,
            forceState: props.forceState || false,
        }

        this.saveStatus = this.saveStatus.bind(this);
        this.editTarget = this.editTarget.bind(this);
        this.switchAndSave = this.switchAndSave.bind(this);
    }

    //when props are updated, check if forceState is set, if so update state
    componentDidUpdate(prevProps) {
        if (prevProps.forceState !== this.props.forceState) {
            this.editTarget(this.props.forceState ? true : this.state.locked);

            this.setState({
                forceState: this.props.forceState, 
                locked: this.props.forceState ? true : this.state.locked
            });
        }
    }

    saveStatus() {
        let current = JSON.parse(window.localStorage.getItem("dshlocks")) || {};

        current[this.state.target] = {
            locked: this.state.locked
        }

        window.localStorage.setItem("dshlocks", JSON.stringify(current));
    }

    editTarget(newState=null) {
        document.getElementById(this.state.target).disabled = typeof newState == "boolean" ? newState : this.state.locked;
    }

    switchAndSave() {
        if (this.state.forceState) return;

        this.state.locked = !this.state.locked;
        this.editTarget();
        this.saveStatus();

        this.forceUpdate();
    }
    
    componentDidMount() {
        this.editTarget();
    }

    render() {
        return (
            <button disabled={this.state.forceState} className={"dashboard-lock-input-button dashboard-lock-input-button-" + (this.state.locked ? "locked" : "unlocked")} onClick={this.switchAndSave}>
                {this.state.locked ? emojis.locked : emojis.unlocked}
            </button>
        )
    }
}

class Dashboard extends React.Component {
    constructor(props) {
        super(props);

        let robotIP = "localhost";
        let port = "5805";


        if (window.localStorage.getItem("nt") != null) {
            const savedNT = JSON.parse(window.localStorage.getItem("nt"));

            robotIP = savedNT.host;
            port = savedNT.port;
        }

        let pynetworktablesIP = "localhost";
        let pynetworktablesPort = 8888;

        if (window.localStorage.getItem("pyntsaved") != null) {
            const savedPyNT = JSON.parse(window.localStorage.getItem("pyntsaved"));

            pynetworktablesIP = savedPyNT.ip;
            pynetworktablesPort = savedPyNT.port;
        }

        if (!window["getRobotServerURL"]) {
            window.getRobotServerURL = () => {
                return "http://" + robotIP + ":" + port;
            }
        }

        let robotWidth = 25;
        let robotLength = 25;

        if (window.localStorage.getItem("robot-size") != null) {
            const savedSize = JSON.parse(window.localStorage.getItem("robot-size"));

            robotWidth = savedSize.width;
            robotLength = savedSize.length;
        }

        let maxVelocity = 3;

        if (window.localStorage.getItem("swerve-settings") != null) {
            const savedSettings = JSON.parse(window.localStorage.getItem("swerve-settings"));

            maxVelocity = savedSettings.maxVelocity;
        }

        let pathPlanning = ppDefaults;

        if (SaveManager.load("/pathsettings") != null) {
            pathPlanning = SaveManager.load("/pathsettings");
            
            pathPlanning = Object.assign(ppDefaults, pathPlanning);
        }

        let logWriterName = "EmptyLogWriter";
        let eventListenerName = "EmptyEventListener";
        let lockLogWriter = false;
        let lockEventListener = false;

        this.state = {
            isOpen: (window.localStorage.getItem("sidebar-open") || "false") == "true",
            updateNTInfoInterval: null,
            robotIP,
            port,
            pynetworktablesIP,
            pynetworktablesPort,
            eventListenerName,
            logWriterName,
            lockLogWriter,
            lockEventListener,
            robotWidth,
            robotLength,
            maxVelocity,
            pathPlanning
        }

        this.toggleSidebarOpen = this.toggleSidebarOpen.bind(this);
        this.sendPreferences = this.sendPreferences.bind(this);
        this.saveSwerveSettings = this.saveSwerveSettings.bind(this);
        this.savePathPlanningSettings = this.savePathPlanningSettings.bind(this);
    }

    toggleSidebarOpen() {
        this.state.isOpen = !this.state.isOpen;

        window.localStorage.setItem("sidebar-open", this.state.isOpen)

        this.forceUpdate();
    }

    sendPreferences() {
        const loggerName = document.getElementById("logger-name").value;
        const eventListenerName = document.getElementById("event-listener-select").value;

        //Send Preferences
        const payload = {
            logWriter: this.state.lockLogWriter ? "" : loggerName,
            eventListener: this.state.lockEventListener ? "" : eventListenerName
        }

        if (this.state.lockLogWriter || this.state.lockEventListener) {
            alert("Not sending all preferences since some are locked in the robot. To change locked preferences, please use the preferences code in 8840-utils. Ignore this if you know what you're doing.");
        }

        const url = window.getRobotServerURL() + "/preferences";

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    console.log("[Dashboard] Preferences sent successfully");
                    alert("Sent preferences successfully. Please restart the robot code to apply changes.");
                } else {
                    console.warn("[Dashboard] Error sending preferences: ", data.message);
                    alert("Error sending preferences: " + data.message);
                }
            }
        ).catch((err) => {
            console.warn("Error sending preferences: ", err);
            alert("Looks like the robot is not connected. Unable to send preferences! Please connect to the robot beforehand.")
        });
    }

    componentDidMount() {
        try {
            fetch(window.getRobotServerURL() + "/preferences")
                .then(res => res.json())
                .then(data => {
                    if (data["logWriter"] != null) {
                        document.getElementById("logger-name").value = data["logWriter"];
                        this.setState({logWriterName: data["logWriter"]})
                    }

                    if (data["eventListener"] != null) {
                        document.getElementById("event-listener-select").value = data["eventListener"];
                        this.setState({eventListenerName: data["eventListener"]})
                    }

                    if (data["lockedLogWriter"] != null) {
                        this.setState({lockLogWriter: data["lockedLogWriter"]})
                    }

                    if (data["lockedEventListener"] != null) {
                        this.setState({lockEventListener: data["lockedEventListener"]})
                    }

                    this.forceUpdate();
                })
                .catch(e => {
                    //console.log(e);
                })
        } catch (e) {
            console.warn("[Dashboard] Error while fetching for current preferences", e);
        }

        this.state.updateNTInfoInterval = setInterval(() => {
            document.getElementById("incoming-num").innerText = window.ntmetrics.totalIncoming;
            document.getElementById("outgoing-num").innerText = window.ntmetrics.totalOutgoing;

            document.getElementById("incoming-size").innerText = window.ntmetrics.totalIncomingSize + "B";
            document.getElementById("outgoing-size").innerText = window.ntmetrics.totalOutgoingSize + "B";

            document.getElementById("incoming-num-last-second").innerText = window.ntmetrics.lastSecondIncoming;
            document.getElementById("outgoing-num-last-second").innerText = window.ntmetrics.lastSecondOutgoing;
        }, 500); //doesn't have to be too fast since it only updates the text
    }

    saveRobotServerInfo() {
        const robotIP = document.getElementById("server-ip").value;
        const port = document.getElementById("server-port").value;
        
        const savedNT = window.localStorage.getItem("nt");

        if (savedNT) {
            window.localStorage.setItem("nt", JSON.stringify({
                host: robotIP,
                port: port,
                timeoutPeriod: savedNT.timeoutPeriod
            }))
        } else {
            window.localStorage.setItem("nt", JSON.stringify({
                host: robotIP,
                port: port,
                timeoutPeriod: 10000
            }))
        }

        alert("Saved!")
    }

    saveRobotDimensions() {
        window.localStorage.setItem("robot-size", JSON.stringify({
            width: document.getElementById("robot-width").value,
            length: document.getElementById("robot-length").value
        }))
    }

    saveSwerveSettings() {
        window.localStorage.setItem("swerve-settings", JSON.stringify({
            maxVelocity: document.getElementById("max-velocity").value,
        }))
    }

    savePathPlanningSettings() {
        const tbSaved = {
            maxSpeed: parseFloat(document.getElementById("path-planning-max-velocity").value),
            minSpeed: parseFloat(document.getElementById("path-planning-min-velocity").value),
            maxAccel: parseFloat(document.getElementById("path-planning-max-acceleration").value),
            pid: new PID(
                parseFloat(document.getElementById("path-planning-p").value),
                parseFloat(document.getElementById("path-planning-i").value),
                parseFloat(document.getElementById("path-planning-d").value)
            )
        };

        console.log("Saving path settings!", tbSaved)

        SaveManager.save("/pathsettings", tbSaved)
    }

    redirect(path=null) {
        //if path is null, then the bind will pass the path
        window.location.href = typeof path == "object" ? String(this) : String(path);
    }

    componentWillUnmount() {
        clearInterval(this.state.updateNTInfoInterval);
    }

    render() {
        return (
            <div className="dashboard">
                <div id="close-dashboard-sidebar" className={"close-dashboard-sidebar " + (this.state.isOpen ? "" : "close-dashboard-sidebar-close-position")}>
                    <button onClick={this.toggleSidebarOpen}><Icon path={this.state.isOpen ? mdiArrowLeft : mdiArrowRight} size={0.8}/></button>
                </div>
                <div id="dashboard-sidebar" className={"dashboard-sidebar " + (this.state.isOpen ? "" : "dashboard-sidebar-closed")}>
                    <DashboardSidebarContent title="Networking">
                        <p>Robot IP</p>
                        <input defaultValue={this.state.robotIP} id="server-ip" name="server-ip" /> 
                        <DashboardLockInput target={"server-ip"}/>
                        <p>Port of 8840-utils Server</p>
                        <input defaultValue={this.state.port} id="server-port" name="server-port" />
                        <DashboardLockInput target={"server-port"} defaultValue={true} />
                        <br/>
                        <button className="sidebar-button" onClick={this.saveRobotServerInfo.bind(this)}>Save</button>
                    </DashboardSidebarContent>
                    <DashboardSidebarContent title="Robot Preferences">
                        <p>Logger</p>
                        <input defaultValue={this.state.logWriterName} id="logger-name" name="logger-name" /> 
                        <DashboardLockInput target={"logger-name"} defaultValue={true} forceState={this.state.lockLogWriter}/>
                        <p>EventListener</p>
                        <input defaultValue={this.state.eventListenerName} id="event-listener-select" name="event-listener" />
                        <DashboardLockInput target={"event-listener-select"} defaultValue={true} forceState={this.state.lockEventListener}/>
                        <br/>
                        <button className="sidebar-button" onClick={this.sendPreferences}>Save and Send To Settings</button>
                    </DashboardSidebarContent>
                    <DashboardSidebarContent title="pynetworktables2js">
                        <p>pynetworktables2js Host</p>
                        <input defaultValue={this.state.pynetworktablesIP} id="pyntjs-host" name="pyntjs-host" /> 
                        <DashboardLockInput target={"pyntjs-host"} forceState={true} defaultValue={true}/>
                        <p>pynetworktables2js Port</p>
                        <input defaultValue={this.state.pynetworktablesPort} id="pyntjs-port" name="pyntjs-port" />
                        <DashboardLockInput target={"pyntjs-port"} forceState={true} defaultValue={true} />
                    </DashboardSidebarContent>
                    <DashboardSidebarContent title="Game Phases">
                        <p>Current Phase</p>
                        <input defaultValue={"None"} id="current-phase" name="current-phase" /> 
                        <DashboardLockInput target={"current-phase"} forceState={true} defaultValue={true}/>
                        <p>Autonomous Timing (seconds)</p>
                        <input defaultValue={"15"} id="autonomous-timing" name="autonomous-timing" />
                        <DashboardLockInput target={"autonomous-timing"} forceState={true} defaultValue={true} />
                        <p>Teleoperated Timing (minutes:seconds)</p>
                        <input defaultValue={"2:15"} id="teleop-timing" name="teleop-timing" />
                        <DashboardLockInput target={"teleop-timing"} forceState={true} defaultValue={true} />
                    </DashboardSidebarContent>
                    <DashboardSidebarContent title="Robot Dimensions">
                        <p>Width</p>
                        <input defaultValue={this.state.robotWidth} min={0} id="robot-width" name="robot-width" type="number" /> 
                        <DashboardLockInput target={"robot-width"} forceState={false} defaultValue={false}/>
                        <p>Length</p>
                        <input defaultValue={this.state.robotLength} min={0} id="robot-length" name="robot-length" /> 
                        <DashboardLockInput target={"robot-length"} forceState={false} defaultValue={false}/>
                        <button className="sidebar-button" onClick={this.saveRobotDimensions}>Save</button>
                    </DashboardSidebarContent>
                    <DashboardSidebarContent title="Swerve Settings">
                        <p>Max Velocity</p>
                        <input defaultValue={this.state.maxVelocity} min={0} id="max-velocity" name="max-velocity" type="number" />
                        <button className="sidebar-button" onClick={this.saveSwerveSettings}>Save</button>
                    </DashboardSidebarContent>
                    <DashboardSidebarContent title="Path Planning">
                        <p>P</p>
                        <input step={0.001} defaultValue={this.state.pathPlanning.pid.p} min={0} id="path-planning-p" name="path-planning-p" type="number" />
                        <DashboardLockInput target={"path-planning-p"} forceState={false} defaultValue={false}/>
                        <p>I</p>
                        <input step={0.001} defaultValue={this.state.pathPlanning.pid.i} min={0} id="path-planning-i" name="path-planning-i" type="number" />
                        <DashboardLockInput target={"path-planning-i"} forceState={false} defaultValue={false}/>
                        <p>D</p>
                        <input step={0.001} defaultValue={this.state.pathPlanning.pid.d} min={0} id="path-planning-d" name="path-planning-d" type="number" />
                        <DashboardLockInput target={"path-planning-d"} forceState={false} defaultValue={false}/>
                        <p>Max Velocity (in/s)</p>
                        <input defaultValue={this.state.pathPlanning.maxSpeed} min={0} id="path-planning-max-velocity" name="path-planning-max-velocity" type="number" />
                        <DashboardLockInput target={"path-planning-max-velocity"} forceState={false} defaultValue={false}/>
                        <p>Min Velocity (in/s)</p>
                        <input defaultValue={this.state.pathPlanning.minSpeed} min={0} id="path-planning-min-velocity" name="path-planning-min-velocity" type="number" />
                        <DashboardLockInput target={"path-planning-min-velocity"} forceState={false} defaultValue={false}/>
                        <p>Max Acceleration (in/s^2)</p>
                        <input defaultValue={this.state.pathPlanning.maxAccel} min={0} id="path-planning-max-acceleration" name="path-planning-max-acceleration" type="number" />
                        <DashboardLockInput target={"path-planning-max-acceleration"} forceState={false} defaultValue={false}/>
                        <button className="sidebar-button" onClick={this.savePathPlanningSettings}>Save</button>
                    </DashboardSidebarContent>
                    <DashboardSidebarContent title="Credits">
                        <h3>Made By</h3>
                        <p>Bay Robotics, FRC Team 8840</p>
                        <p><a href="https://team8840.org" target="_blank">Website</a> • <a href="https://github.com/frc8840" target="_blank">GitHub</a> • <a href="https://www.instagram.com/bay_robotics/" target="_blank">Instagram</a></p>
                        <p><a href="https://github.com/frc8840/8840-app" target="_blank">Source Code</a></p>
                        <h3>Contributors</h3>
                        <ul>
                            <li><a href="https://github.com/jaidenagrimminck" target="_blank">Jaiden Grimminck</a></li>
                        </ul>
                        <h3>Libraries</h3>
                        <ul>
                            <li><a href="https://github.com/robotpy/pynetworktables2js" target="_blank">pynetworktables2js</a></li>
                            <li><a href="https://github.com/google/blockly" target="_blank">Blockly</a></li>
                            <li><a href="https://github.com/mrdoob/three.js" target="_blank">three.js</a></li>
                            <li><a href="https://reactjs.org/" target="_blank">React</a></li>
                        </ul>
                        <br/>
                        <br/>
                        <a href="https://github.com/google/blockly" target="_blank"><img src="/images/google_blockly_logo.png" width="124px" height="44.75px" /></a>
                        <br/>
                        <br/>
                        <br/>
                        <br/>
                    </DashboardSidebarContent>
                    <br/>
                    <br/>
                </div>
                <div className={"dashboard-parent " + (this.state.isOpen ? "" : "dashboard-open-full")} id="dashboard-main">
                    <div className="content-holder">
                        <div>
                            <div className="team-image-parent"><img src="/images/team_logo.svg" width={"275px"} height={"87.5px"} className={"team-image"}/></div>
                            <div className="links">
                                <div className="links-row">
                                    <div onClick={this.redirect.bind("/?tab=home")} style={{backgroundColor: "rgb(212, 88, 88)"}}>Misc</div>
                                    <div onClick={this.redirect.bind("/?tab=path_planner")} style={{backgroundColor: "#39c939"}}>Path Planner</div>
                                </div>
                                <div className="links-row">
                                    <div onClick={this.redirect.bind("/?tab=blocks")} style={{backgroundColor: "#45bfec"}}>Till</div>
                                    <div onClick={this.redirect.bind("/?tab=controls")} style={{backgroundColor: "rgb(212, 73, 195)"}}>Controls</div>
                                </div>
                                <div className="links-row">
                                    <div onClick={this.redirect.bind("/?tab=io")} style={{backgroundColor: "rgb(106, 104, 196)"}}>IO</div>
                                    <div onClick={this.redirect.bind("/?tab=3d")} style={{backgroundColor: "rgb(240, 205, 76)"}}>3D</div>
                                </div>
                                <div className="links-row">
                                    <div onClick={this.redirect.bind("/?tab=custom")} style={{backgroundColor: "#fab319"}}>Custom</div>
                                    <div onClick={this.redirect.bind("/?tab=log")} style={{backgroundColor: "#8634eb"}}>Logging</div>
                                </div>
                            </div>
                        </div>
                        <div className="nt-metrics">
                            <p>Incoming NT Updates: <span id="incoming-num" className="incoming-num">0</span> (<span id="incoming-size" className="incoming-num">0B</span>, last second: <span id="incoming-num-last-second" className="incoming-num">0</span>)</p>
                            <p>Outgoing NT Updates: <span id="outgoing-num" className="outgoing-num">0</span> (<span id="outgoing-size" className="outgoing-num">0B</span>, last second: <span id="outgoing-num-last-second" className="outgoing-num">0</span>)</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default Dashboard;