import initialize from "./networktables.js";

const tabKeySeperator = "/";
const _start = "/8840-lib/";

window.ntmetrics = {
    totalIncoming: 0,
    totalOutgoing: 0,
    totalIncomingSize: 0,
    totalOutgoingSize: 0,
    lastSecondIncoming: 0,
    lastSecondOutgoing: 0,
    start: 0,
}

window.nt_cache = {};

function init(ip="localhost", port=8888) {
    const host = ip + ":" + port;

    //save to localstorage
    window.localStorage.setItem("pyntsaved", JSON.stringify({
        ip,
        port,
    }));

    global.pynttbl2js = {
        host,
    }

    // Initialize pynetworktables2js
    initialize();

    global.nt_listeners = [];

    window.ntmetrics.start = Date.now();

    //Add listener for when robot is connected to networktables
    global.NetworkTables.addRobotConnectionListener((connected) => {
        if (connected) {
            console.log("[NTWrapper] Connected to robot!");
        } else {
            console.log("[NTWrapper] Disconnected from robot!");
        }

        if (!Object.keys(global).includes("robotStatus")) global.robotStatus = {};
        global.robotStatus.connected = connected;
    }, true);

    global.NetworkTables.addGlobalListener((key_, value, isNew) => {
        window.nt_cache[key_] = value;

        const key = key_.replace(_start, "");

        addIncoming(key + String(value));

        for (let ntlistener of global.nt_listeners) {
            const tab = ntlistener.tab;
            if (key.startsWith(tab + tabKeySeperator) || tab == "all") {
                const callback = ntlistener.callback;
                if (typeof callback === "function") {
                    callback(key.replace(tab + tabKeySeperator, ""), value, isNew);
                }
            } else if (tab == "all_ignore_prefix") {
                const callback = ntlistener.callback;
                if (typeof callback === "function") {
                    return callback(key_.startsWith("/") ? key_.substring(1) : key_, value, isNew);
                }
            }
        }
    }, true);

    setInterval(() => {
        window.ntmetrics.lastSecondIncoming = 0;
        window.ntmetrics.lastSecondOutgoing = 0;
    }, 1000)
}

function addTabListener(tab, callback=(key, value, isNew) => {}) {
    global.nt_listeners.push({
        tab,
        callback
    });
    console.log("[NTWrapper] Added tab listener for tab " + tab);
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

function putValue(tab, path, value) {
    let success = global.NetworkTables.putValue(`${_start}${tab}/${path}`, value);
    addOutgoing(`${_start}${tab}/${path}${String(value)}`, success)
    return success;
}

function addIncoming(dataAsString) {
    window.ntmetrics.totalIncoming++;
    window.ntmetrics.lastSecondIncoming++;
    window.ntmetrics.totalIncomingSize += new Blob([dataAsString]).size;
}

function addOutgoing(dataAsString) {
    window.ntmetrics.totalOutgoing++;
    window.ntmetrics.lastSecondOutgoing++;
    window.ntmetrics.totalOutgoingSize += new Blob([dataAsString]).size;
}

export default init;

export { addTabListener, getValue, getTabKeys, putValue, getTabs };