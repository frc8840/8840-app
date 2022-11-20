
async function setupClient() {

}

async function stopClient() {

}

function getBase() {
    if (global) {
        return `http://${global.nt.host}:${global.nt.port}`;
    } else {
        return `http://${window.nt.host}:${window.nt.port}`;
    }
}

async function standardRequest(url) {
    const response = await fetch(url);
    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw "Could not parse response from NT server, " + e;
    }

    if (data.success) {
        return data.value;
    } else throw data.message;
}

/**
 * Lookup the keys in a tab or recieve a list of all tabs.
 * @param {string} tab The tab to lookup. Leave blank for a list of all tabs.
 * @returns 
 */
async function getTabsOrKeys(tab="list") {
    const url = `${getBase()}/nt?tab=${tab}`;

    const response = await fetch(url);
    let data;
    try {
        data = await response.json();
    } catch (e) {
        throw "Could not parse response from NT server, " + e;
    }

    if (data.success) {
        return tab == "list" ? data.tabs : data.keys;
    } else throw data.message;
}

async function getNT(tab, key, type="string") {
    const url = `${getBase()}/nt?tab=${encodeURI(tab)}&key=${encodeURI(key)}&operation=get&type=${type}`;
    
    return await standardRequest(url);
}

async function setNT(tab, key, type, newValue) {
    const url = `${getBase()}/nt?tab=${encodeURI(tab)}&key=${encodeURI(key)}&operation=set&type=${type}&value=${encodeURI(newValue)}`;

    return await standardRequest(url);
}

async function ping() {
    const url = `${getBase()}/json`;
    
    try {
        const request = await fetch(url);

        return request.status === 200;
    } catch (e) {
        return false;
    }
}


export default {getNT, setNT, getTabsOrKeys, ping, setupClient, stopClient};