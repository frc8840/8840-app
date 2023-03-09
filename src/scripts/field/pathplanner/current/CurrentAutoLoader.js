import { addTabListener } from "../../../pynetworktables2js/wrapper";

class Conjugate {
    static Type = {
        "Path": 0,
        "Action": 1,
        fromString(str) {
            return this[str];
        }
    }
    constructor(json) {
        if (typeof json == "string") {
            json = JSON.parse(json);
        }
        this.type = Conjugate.Type.fromString(json[".info"].type);
        this.path = this.type == Conjugate.Type.Path ? json.path : null;
        this.name = json[".info"].name;
    }
}

class CurrentAutoLoader {
    constructor() {
        this.conjugates = [];
        this.name = "no_name";
        this.number = 0;

        this.active = false;
        this.onIndex = -1;

        this.success = false;

        window.CurrentAutoLoader = this;

        this.tryAgainInTen = this.tryAgainInTen.bind(this);
        this.requestForInfo = this.requestForInfo.bind(this);

        try {
            this.requestForInfo();
        } catch (e) {
            console.error(e);
            this.tryAgainInTen();
        }

        setInterval(() => {
            if (!!window.nt_cache) {
                const index = Object.keys(window.nt_cache).includes("/8840-lib/auton/i") ? window.nt_cache["/8840-lib/auton/i"] : -1;
                const active = Object.keys(window.nt_cache).includes("/8840-lib/auton/a") ? window.nt_cache["/8840-lib/auton/a"] : false;

                if (index != this.onIndex || active != this.active) {
                    console.log("[Autonomous] Active: " + this.active + " -> " + active + ", Index: " + this.onIndex + " -> " + index);
                    this.onIndex = index;
                    this.active = active;
                }
            }
        }, 10)
    }
    tryAgainInTen() {
        setTimeout(() => {
            if (this.success) return;
            if (!!window.pause) return;

            try {
                this.requestForInfo();
            } catch (e) {
                console.error(e);
                this.tryAgainInTen();
            }    
        }, 10000);
    }
    async requestForInfo() {
        const url = "http://" + window.nt.host + ":" + window.nt.port + "/auto/selected";

        const request = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        const json = await request.json();

        this.name = json[".info"].name;
        this.number = json[".info"].number;
        this.conjugates = json.conjugates.map((c) => new Conjugate(c));

        this.success = true;
    }

    startIndexRequest() {
        setInterval(() => {
            try {
                if (!!window.pause) return;

                this.requestForIndex();
            } catch (e) {
                
            }
        }, 100);
    }
}

export default CurrentAutoLoader;

export { Conjugate };