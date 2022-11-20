import initialize from "./networktables.js";

const tabKeySeperator = "/";
const _start = "/Shuffleboard/";

function init(host="localhost:8888") {
    global.pynttbl2js = {
        host,
    }

    // Initialize pynetworktables2js
    initialize();

    global.nt_listeners = {};

    //Add listener for when robot is connected to networktables
    global.NetworkTables.addRobotConnectionListener((connected) => {
        if (connected) {
            console.log("Connected to robot!");
        } else {
            console.log("Disconnected from robot!");
        }

        if (!Object.keys(global).includes("robotStatus")) global.robotStatus = {};
        global.robotStatus.connected = connected;
    }, true);

    global.NetworkTables.addGlobalListener((key_, value, isNew) => {
        const key = key_.replace("/Shuffleboard/", "");

        for (let tab of Object.keys(global.nt_listeners)) {
            if (key.startsWith(tab + tabKeySeperator)) {
                const callback = global.nt_listeners[tab];
                if (typeof callback === "function") {
                    callback(key.replace(tab + tabKeySeperator, ""), value, isNew);
                }
            }
        }
    }, true);
}

function addTabListener(tab, callback=(key, value, isNew) => {}) {
    global.nt_listeners[tab] = callback;
    console.log("Added tab listener for tab " + tab);
}

function getValue(tab, key, defaultValue=null) {
    return global.NetworkTables.getValue(_start + tab + tabKeySeperator + key, defaultValue);
}

function getTabKeys(tab) {
    return Object.keys(global.NetworkTables.getKeys()).filter((key) => key.startsWith(_start + tab + tabKeySeperator)).map((key) => key.replace(tab + tabKeySeperator, ""));
}

function getTabs() {
    return Object.keys(global.NetworkTables.getKeys()).map((key) => key.replace(_start, "").split(tabKeySeperator)[0]).filter((value, index, self) => self.indexOf(value) === index);
}


export default init;

export { addTabListener, getValue, getTabKeys };