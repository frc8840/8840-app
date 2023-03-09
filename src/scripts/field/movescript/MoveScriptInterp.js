import { Unit } from "../../misc/unit";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

class MSPath {
    constructor(name) {
        this.name = name;
        this.raw = "";

        this.start = [];

        this.segments = [];
    }

    checkPosition(position, i) {
        if (position.startsWith("(")) {
            if (!position.endsWith(")")) {
                throw new Error("Invalid position syntax on line " + (i + 1));
            }

            position = position.substring(1, position.length - 1);

            let values = position.split(",");

            if (values.length != 2) {
                throw new Error("Invalid 2D position syntax on line " + (i + 1));
            }

            //Find the unit type
            let unitType = Unit.Type.INCHES;
            if (values[0].endsWith("m")) {
                unitType = Unit.Type.METERS;
            } else if (values[0].endsWith("ft")) {
                unitType = Unit.Type.FEET;
            } else if (values[0].endsWith("cm")) {
                unitType = Unit.Type.CENTIMETERS;
            } else if (values[0].endsWith("mm")) {
                unitType = Unit.Type.MILLIMETERS;
            } else if (values[0].endsWith("in")) {
                unitType = Unit.Type.INCHES;
            } else {
                throw new Error("Invalid x-position syntax (require-unit) on line " + (i + 1));
            }

            let unitType2 = Unit.Type.INCHES;
            let ulen = 2;
            if (values[1].endsWith("m")) {
                unitType2 = Unit.Type.METERS;
                ulen = 1;
            } else if (values[1].endsWith("ft")) {
                unitType2 = Unit.Type.FEET;
            } else if (values[1].endsWith("cm")) {
                unitType2 = Unit.Type.CENTIMETERS;
            } else if (values[1].endsWith("mm")) {
                unitType2 = Unit.Type.MILLIMETERS;
            } else if (values[1].endsWith("in")) {
                unitType2 = Unit.Type.INCHES;
            } else {
                throw new Error("Invalid y-position syntax (require-unit) on line " + (i + 1));
            }

            let val1Operation = "";

            if (values[0].startsWith("+")) {
                val1Operation = "+";
            } else if (values[0].startsWith("-")) {
                val1Operation = "-";
            }

            let val2Operation = "";

            if (values[1].startsWith("+")) {
                val2Operation = "+";
            } else if (values[1].startsWith("-")) {
                val2Operation = "-";
            }

            if (val1Operation != "") {
                values[0] = values[0].substring(1);
            }

            if (val2Operation != "") {
                values[1] = values[1].substring(1);
            }

            let value1Number = parseFloat(values[0].substring(0, values[0].length - ulen));
            let value2Number = parseFloat(values[1].substring(0, values[1].length - ulen));

            
            return {
                x: new Unit(value1Number, unitType),
                y: new Unit(value2Number, unitType2),
                type1: val1Operation,
                type2: val2Operation
            }
        }

        return {
            x: new Unit(0, Unit.Type.INCHES),
            y: new Unit(0, Unit.Type.INCHES),
            type1: "",
            type2: ""
        }
    }

    loadRaw(raw) {
        this.raw = raw;

        let location = [];
        let currentLocation = null;

        for (let i = 0; i < raw.length; i++) {
            let line = raw[i];

            // Skip comments
            if (line.startsWith("//")) {
                continue;
            }

            // Skip empty lines
            if (line.length == 0) {
                continue;
            }

            // Start
            if (line.startsWith("#START")) {
                let key, value;
                try {
                    key = line.split(" ")[1];
                } catch (e) {
                    throw new Error("Invalid start syntax on line " + (i + 1));
                }
                try {
                    value = line.substring(line.indexOf(key) + key.length);
                } catch (e) {
                    value = "NO_NAME";
                }

                if (key == "SEGMENT") {
                    location.push(["SEGMENT", i, value])
                    this.segments.push([]);
                    this.start.push({
                        x: new Unit(0, Unit.Type.INCHES),
                        y: new Unit(0, Unit.Type.INCHES),
                    })

                    currentLocation = this.start[this.start.length - 1];
                } else {
                    throw new Error("Unknown start key: " + key);
                }
            }

            if (line.startsWith("START") || line.startsWith("HARD") || line.startsWith("SOFT")) {
                let position = line.substring(5);
                position.trim();

                const pos = this.checkPosition(position, i);

                let newCurrentLocation = {
                    x: new Unit(pos.x.get(Unit.Type.INCHES), Unit.Type.INCHES),
                    y: new Unit(pos.y.get(Unit.Type.INCHES), Unit.Type.INCHES)
                }
                
                if (pos.type1 == "+") {
                    //deep copy
                    currentLocation = Object.assign(newCurrentLocation, {
                        x: new Unit(currentLocation.x.get(Unit.Type.INCHES) + pos.x.get(Unit.Type.INCHES), Unit.Type.INCHES),
                    })
                } else if (pos.type1 == "-") {
                    //deep copy
                    currentLocation = Object.assign(newCurrentLocation, {
                        x: new Unit(currentLocation.x.get(Unit.Type.INCHES) - pos.x.get(Unit.Type.INCHES), Unit.Type.INCHES),
                    })
                }

                if (pos.type2 == "+") {
                    //deep copy
                    currentLocation = Object.assign(newCurrentLocation, {
                        y: new Unit(currentLocation.y.get(Unit.Type.INCHES) + pos.y.get(Unit.Type.INCHES), Unit.Type.INCHES),
                    })
                } else if (pos.type2 == "-") {
                    //deep copy
                    currentLocation = Object.assign(newCurrentLocation, {
                        y: new Unit(currentLocation.y.get(Unit.Type.INCHES) - pos.y.get(Unit.Type.INCHES), Unit.Type.INCHES),
                    })
                }

                if (line.startsWith("start")) {
                    if (pos.type1 != "" || pos.type2 != "") {
                        throw new Error("Invalid start position, cannot make adjustments on start, only strict positions on line " + (i + 1));
                    }
                    this.start[this.start.length - 1] = newCurrentLocation;
                } else {
                    this.segments[this.segments.length - 1].push({
                        x: new Unit(currentLocation.x.get(Unit.Type.INCHES), Unit.Type.INCHES),
                        y: new Unit(currentLocation.y.get(Unit.Type.INCHES), Unit.Type.INCHES),
                        type: line.startsWith("HARD") ? "HARD" : "SOFT"
                    })
                }
                
                currentLocation = newCurrentLocation;
            }
        }

        return this;
    }
}

class MSInterpreter {
    constructor() {
        this.raw = "";

        this.name = "";
        this.field = "";
        
        this.paths = [];
    }

    loadRaw(raw) {
        this.raw = raw;

        let location = [];

        for (let i = 0; i < raw.length; i++) {
            let line = raw[i];

            // Skip comments
            if (line.startsWith("//")) {
                continue;
            }

            // Skip empty lines
            if (line.length == 0) {
                continue;
            }

            // Define
            if (line.startsWith("#DEFINE")) {
                let name;
                try {
                    name = line.split(" ")[1];
                } catch (e) {
                    throw new Error("Invalid define syntax on line " + (i + 1));
                }

                //remove the name and everything before it
                line = line.substring(line.indexOf(name) + name.length);

                line = line.trim();

                if (!(line.startsWith("{") && line.endsWith("}"))) {
                    throw new Error("Invalid define syntax on line " + (i + 1) + "");
                }

                line = line.substring(1, line.length - 1);

                const values = line.split(",");
                for (let i = 0; i < values.length; i++) {
                    values[i] = values[i].trim();
                }

                if (name == "NAME") {
                    this.name = values[0];
                } else if (name == "FIELD") {
                    this.field = values[0];
                } else {
                    throw new Error("Unknown define: " + name);
                }
            }

            // Start
            if (line.startsWith("#START")) {
                let key, value;
                try {
                    key = line.split(" ")[1];
                } catch (e) {
                    throw new Error("Invalid start syntax on line " + (i + 1));
                }
                try {
                    value = line.substring(line.indexOf(key) + key.length);

                    value = value.trim();

                    if (value.startsWith("{") && value.endsWith("}")) {
                        value = value.substring(1, value.length - 1);
                    } else {
                        throw new Error("Invalid start syntax on line " + (i + 1));
                    }
                } catch (e) {
                    value = "NO_NAME";
                }

                if (key == "PATH") {
                    location.push(["PATH", i, value]);
                } else if (key == "SEGMENT") {
                    location.push(["SEGMENT", i, value])
                } else {
                    throw new Error("Unknown start key: " + key);
                }
            }

            // End
            if (line.startsWith("#END")) {
                const key = line.split(" ")[1];

                if (key == "PATH") {
                    const start = location.pop();

                    if (start[0] != "PATH") {
                        throw new Error("Invalid end syntax for PATH on line " + (i + 1));
                    }

                    this.paths.push(
                        new MSPath(
                            start[2]
                        ).loadRaw(
                            raw.slice(start[1] + 1, i)
                        )
                    );
                } else if (key == "SEGMENT") {
                    const start = location.pop();

                    if (start[0] != "SEGMENT") {
                        throw new Error("Invalid end syntax for SEGMENT on line " + (i + 1));
                    }
                } else {
                    throw new Error("Unknown end key: " + key);
                }
            }
        }
        
        return this;
    }
}