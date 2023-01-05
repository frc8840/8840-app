
window.verboseSave = false;

function saveDestroy() {
    window.localStorage.removeItem("8840app");
}

window.saveDestroy = saveDestroy;

function saveGeneral(data={}) {
    if (!window.localStorage.getItem("8840app")) {
        window.localStorage.setItem("8840app", JSON.stringify({
            created: new Date().getTime(),
            lastUpdated: new Date().getTime(),
            data,
        }));
    }

    const general = JSON.parse(window.localStorage.getItem("8840app"));

    window.localStorage.setItem("8840app", JSON.stringify({
        created: general.created,
        lastUpdated: new Date().getTime(),
        data,
    }));
}

function loadGeneral() {
    if (window.localStorage.getItem("8840app") == null) {
        saveGeneral();
    }

    if (window.localStorage.getItem("8840app")) {
        return JSON.parse(window.localStorage.getItem("8840app"));
    }
    return {};
}

window.loadGeneral = loadGeneral;

function save(path="", _data={}) {
    let data = loadGeneral();

    if (path.includes("/")) {
        let pathArray = path.split("/");
        let current = data.data;
        for (let i = 0; i < pathArray.length; i++) {
            if (i === pathArray.length - 1) {
                current[pathArray[i]] = _data;
            } else {
                if (!current[pathArray[i]]) {
                    current[pathArray[i]] = {};
                }
                current = current[pathArray[i]];
            }
        }
    } else {
        if (window.verboseSave) console.log("[Save Manager] Saved data to path '" + path + "'")
        data.data[path] = _data;
    }

    saveGeneral(data.data);
}

function load(path="") {
    let data = loadGeneral();

    if (path.includes("/")) {
        let pathArray = path.split("/");
        let current = data.data;
        for (let i = 0; i < pathArray.length; i++) {
            if (i === pathArray.length - 1) {
                return current[pathArray[i]];
            } else {
                if (!current[pathArray[i]]) {
                    return undefined;
                }
                current = current[pathArray[i]];
            }
        }
    } else {
        if (window.verboseSave) console.log("[Save Manager] Loaded data from path '" + path + "'", data.data)
        return data.data[path];
    }
}

export default {
    saveGeneral,
    loadGeneral,
    save,
    load
}

export {
    saveGeneral,
    loadGeneral,
    save,
    load
}