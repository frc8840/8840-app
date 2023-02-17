
const delta_step = 100;

class LogAnalyzer {
    constructor() {
        this.playback = 0;
        
        this.max = 0;
        this.maxTime = 0; //In milliseconds

        this.startTime = new Date(0);
        this.endTime = new Date(0);

        setTimeout(() => {
            window.log.awaitToFinish().then(() => {
                console.log("[LogAnalyzer] Finished analyzing log!");
                this.onLoad();
            });
        }, 100)
    }
    getDataNow() {
        return this.getDataAtTime(this.playback);
    }
    getDataAtTime(time) {
        //First, calculate the cycle, or closest cycle to the time
        const cycle = Math.floor(time / delta_step);

        if (cycle < 0) return {};
        if (cycle > this.max) return {};

        let dataAtPoint = {};

        //Now, get the data at that cycle
        for (let data of Object.keys(window.log.info)) {
            let closestUpdateCycle = 0;
            const valList = window.log.info[data].values;
            for (let i = 0; i < valList.length; i++) {
                if (valList[i].c > cycle) break;

                closestUpdateCycle = i;
            }

            const closestUpdate = valList[closestUpdateCycle];

            dataAtPoint[data] = {
                type: window.log.info[data].type,
                value: closestUpdate.v
            };
        }

        return dataAtPoint;
    }
    onLoad() {
        this.max = window.log.cycles;
        this.playback = 0;
        this.maxTime = this.max * delta_step;

        const firstMessageSplit = window.log.messages[0].split(" ");
        this.startTime = new Date(
            parseInt(firstMessageSplit[firstMessageSplit.length - 1].replace(".", ""))
        ); 

        const lastMessageSplit = window.log.messages[window.log.messages.length - 1].split(" ");
        if (window.log.messages[window.log.messages.length - 1].includes("Successfully")) {
            this.endTime = new Date(
                parseInt(lastMessageSplit[lastMessageSplit.length - 1].replace(".", ""))
            );
        } else {
            console.log("[LogAnalyzer] Log did not finish successfully. Estimating end time...")
            this.endTime = new Date(
               this.startTime.getTime() + this.maxTime
            )
        }

        console.log("[LogAnalyzer] Max cycles:", this.max);
        console.log("[LogAnalyzer] Max time:", this.maxTime);
        console.log("[LogAnalyzer] Start time:", this.startTime);
        console.log("[LogAnalyzer] End time:", this.endTime);
    }
}

export default LogAnalyzer;