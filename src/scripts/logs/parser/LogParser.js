
class LogParser {
    static Types = {
        String: "s",
        Double: "d",
        String_Array: "S",
        Double_Array: "D",
        Byte_Array: "B",
    }
    constructor() {
        this.data = null;

        this.cycles = 0;
        this.earlyCycles = 0;
        
        this.info = {

        };

        this.references = {};

        this.messages = [];

        this.finished = false;
    }
    load(data) {
        this.data = data.split("\n");
        this.finshed = false;
    }
    awaitToFinish(timeout=-1) {
        return new Promise((resolve, reject) => {
            let total = 0;
            const interval = setInterval(() => {
                if (this.finished) {
                    clearInterval(interval);
                    resolve();
                }
                total += 100;
                if (total >= timeout && timeout != -1) {
                    clearInterval(interval);
                    reject();
                }
            }, 100);
        });
    }
    analyze() {
        if (!Object.keys(this).includes("data")) return;
        if (this.data == null) return;

        console.log(`Started to analyze log (${this.data.length} lines).`)
        console.time("LogParser.analyze")

        for (let line of this.data) {
            this.analyzeLine(line);
        }

        //Delete the data to save memory
        delete this.data;

        this.finished = true;
        
        console.log("Finshed with log analysis.")
        console.timeEnd("LogParser.analyze")
    }
    analyzeLine(line) {
        if (line.startsWith("d")) {
            const reference = line.substring(1, line.indexOf("/"));
            const value = line.substring(line.indexOf("/") + 1);
            this.analyzeDatapoint(reference, value);
        } else if (line.startsWith("a")) {
            const name = line.substring(1, line.indexOf("/") - 1);
            const type = line.substring(line.indexOf("/") - 1, line.indexOf("/"));
            const reference = parseInt(line.substring(line.indexOf("/") + 1));
            this.analyzeDeclaration(name, type, reference);
        } else if (line.startsWith("ALC")) {
            const isEarlyCycle = line.includes("(s)");
            this.cycles++;
            if (isEarlyCycle) this.earlyCycles++;
        } else {
            this.messages.push(line);
        }
    }
    parseValue(type, value) {
        if (type == LogParser.Types.String) {
            return value;
        } else if (type == LogParser.Types.Double) {
            return parseFloat(value);
        } else if (type == LogParser.Types.String_Array) {
            let removedBrackets = value.substring(1, value.length - 1);
            return removedBrackets.split(", ");
        } else if (type == LogParser.Types.Double_Array) {
            let removedBrackets = value.substring(1, value.length - 1);
            let split = removedBrackets.split(","); //Spaces are removed in double arrays to conserve space.
            let parsed = [];
            for (let i = 0; i < split.length; i++) {
                parsed.push(parseFloat(split[i]));
            }
            return parsed;
        } else if (type == LogParser.Types.Byte_Array) {
            return value;
        }
    }

    analyzeDeclaration(name, type, reference) {
        if (Object.keys(this.references).includes(reference)) {
            console.error("Duplicate datapoint: " + name);
            return;
        }

        this.references[reference] = {
            name,
            type
        }

        this.info[name] = {
            type,
            values: []
        }
    }   

    analyzeDatapoint(reference, value) {
        if (!Object.keys(this.references).includes(reference)) {
            console.error("Unknown datapoint: REF " + reference);
            return;
        }

        const name = this.references[reference].name;
        const type = this.references[reference].type;

        this.info[name].values.push({
            v: this.parseValue(type, value),
            c: this.cycles
        })
    }
}

export default LogParser;