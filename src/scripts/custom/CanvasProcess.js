import { addTabListener, putValue } from "../pynetworktables2js/wrapper";

class CanvasSupplier {
    static Type = {
        STRING: "s",
        NUMBER: "n",
        NETWORK_TABLE: "t",
        CALCULATION: "c",
        PERCENTAGE: "p",
    }
    
    constructor(type, value) {
        this.type = type;
        this.value = value;

        if (this.type == CanvasSupplier.Type.CALCULATION) {
            this.value = decodeURIComponent(this.value);
            this.value = atob(this.value);

            const split = this.value.split("|");
            const value1 = split[0];
            const operation = split[1];
            const value2 = split[2];

            this.leftSide = new CanvasSupplier(value1.substring(0, 1), value1.substring(2));
            this.rightSide = new CanvasSupplier(value2.substring(0, 1), value2.substring(2));
            this.operation = operation;
        } else if (this.type == CanvasSupplier.Type.NETWORK_TABLE) {
            this.value = decodeURIComponent(this.value);
        }
    }

    get(related_argument, canvas) {
        switch(this.type) {
            case CanvasSupplier.Type.STRING:
                return this.value;
            case CanvasSupplier.Type.NUMBER:
                return parseFloat(this.value);
            case CanvasSupplier.Type.NETWORK_TABLE:
                if (!this.value.startsWith("/")) {
                    this.value = "/" + this.value;
                }

                if (!Object.keys(window.nt_cache).includes(this.value)) {
                    return 0;
                }

                const nt_value = window.nt_cache[this.value];

                return nt_value;
            case CanvasSupplier.Type.CALCULATION:
                const leftSide = this.leftSide.get(related_argument, canvas);
                const rightSide = this.rightSide.get(related_argument, canvas);
                switch(this.operation) {
                    case "+":
                        return leftSide + rightSide;
                    case "-":
                        return leftSide - rightSide;
                    case "*":
                        return leftSide * rightSide;
                    case "/":
                        return leftSide / rightSide;
                    case "%":
                        return leftSide % rightSide;
                    case "pow":
                        return Math.pow(leftSide, rightSide);
                    case "sqrt":
                        return Math.sqrt(leftSide);
                    case "atan2":
                        return Math.atan2(leftSide, rightSide);
                    case "mathf":
                        if (Object.getOwnPropertyNames(Math).includes(rightSide)) {
                            return Math[rightSide](leftSide);
                        }
                        return 0;
                }
            case CanvasSupplier.Type.PERCENTAGE:
                //Percentage is percent of canvas width or height.
                if (related_argument == "width" || related_argument == "x") {
                    return canvas.width * (parseFloat(this.value) / 100);
                } else if (related_argument == "height" || related_argument == "y") {
                    return canvas.height * (parseFloat(this.value) / 100);
                }
            default:
                return this.value;
        }
    }
}

class CanvasProcess {
    constructor(rawCommands, name) {
        this.rawCommands = rawCommands;
        this.decodedCommands = "";

        this.commands = [];

        this.name = name;

        this.processCommands();

        //Now, we need to bind the functions to this
        this.argsToObject = this.argsToObject.bind(this);
        this.draw = this.draw.bind(this);
        this.fillRect = this.fillRect.bind(this);
        this.rect = this.rect.bind(this);
        this.clearRect = this.clearRect.bind(this);
        this.fillStyle = this.fillStyle.bind(this);
        this.strokeStyle = this.strokeStyle.bind(this);
        this.lineWidth = this.lineWidth.bind(this);
        this.line = this.line.bind(this);
        this.circle = this.circle.bind(this);
    }

    processCommands() {
        //First, we need to decode the commands
        this.decodedCommands = decodeURIComponent(this.rawCommands);
        //Decode Base64
        this.decodedCommands = atob(this.decodedCommands);
        //Decode URI
        this.decodedCommands = decodeURIComponent(this.decodedCommands);

        //Now, we need to split the commands into an array
        this.commands = [];

        const splitCommands = this.decodedCommands.split(";");

        //remove the last empty command
        splitCommands.pop();

        //Now, we need to split the commands into an array
        for (let i = 0; i < splitCommands.length; i++) {
            const split = splitCommands[i].split(" ");
            const command = split[0];
            const rawArgs = split.slice(1);

            const args = [];
            for (let j = 0; j < rawArgs.length; j++) {
                const splitArg = rawArgs[j].split("=");
                //Example: name=s:foo (name is a string, value is foo)
                const name = splitArg[0];
                //Split by a colon, but we can just use substring
                const type = splitArg[1].substring(0, 1);
                const value = splitArg[1].substring(2);

                args.push({
                    name,
                    type,
                    value: new CanvasSupplier(type, decodeURIComponent(value)),
                });
            }

            this.commands.push({
                command,
                args,
            });
        }

        console.log("[CanvasProcess] Finished processing commands: ", this.commands);
    }

    argsToObject(args) {
        const object = {};

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            object[arg.name] = arg.value;
        }

        return object;
    }

    draw(ctx, frameCount, rel, canvas, mouse) {
        if (this.commands == null) return;

        for (let i = 0; i < this.commands.length; i++) {
            const command = this.commands[i];
            
            if (Object.keys(this).includes(command.command)) {
                this[command.command](ctx, canvas, this.argsToObject(command.args));
            } else {
                console.log("[CanvasProcess] Unknown command: ", command.command, Object.keys(this));
            }
        }

        //send mouse data to network tables
        if (mouse != null) {
            putValue("custom_component", this.name + "/canvas/mouse_x", mouse.x);
            putValue("custom_component", this.name + "/canvas/mouse_y", mouse.y);
            putValue("custom_component", this.name + "/canvas/mouse_down", mouse.down);
        }
    }

    fillRect(ctx, canvas, object) {
        this.rect(ctx, canvas, Object.assign({
            filled: true,
        }, object));
    }

    rect(ctx, canvas, object) {
        const obj = Object.assign({
            x: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 0),
            y: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 0),
            width: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 100),
            height: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 100),
            filled: false
        }, object); //set a few defaults

        const isFilled = object.filled == "true" || object.filled == true;

        if (isFilled) {
            ctx.fillRect(
                obj.x.get("x", canvas), 
                obj.y.get("y", canvas),
                obj.width.get("width", canvas),
                obj.height.get("height", canvas)
            );
        } else {
            ctx.strokeRect(
                obj.x.get("x", canvas), 
                obj.y.get("y", canvas),
                obj.width.get("width", canvas),
                obj.height.get("height", canvas)
            );
        }
    }

    clearRect(ctx, canvas, object) {
        const obj = Object.assign({
            x: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 0),
            y: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 0),
            width: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 100),
            height: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 100),
        }, object); //set a few defaults

        ctx.clearRect(
            obj.x.get("x", canvas), 
            obj.y.get("y", canvas),
            obj.width.get("width", canvas),
            obj.height.get("height", canvas)
        );
    }

    fillStyle(ctx, canvas, object) {
        const obj = Object.assign({
            color: new CanvasSupplier(CanvasSupplier.Type.STRING, "black"),
        }, object); //set a few defaults

        ctx.fillStyle = obj.color.get("color", canvas);
    }

    strokeStyle(ctx, canvas, object) {
        const obj = Object.assign({
            color: new CanvasSupplier(CanvasSupplier.Type.STRING, "black"),
        }, object); //set a few defaults

        ctx.strokeStyle = obj.color.get("color", canvas);
    }

    lineWidth(ctx, canvas, object) {
        const obj = Object.assign({
            width: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 1),
        }, object); //set a few defaults

        ctx.lineWidth = obj.width.get("width", canvas);
    }

    line(ctx, canvas, object) {
        const obj = Object.assign({
            x1: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 0),
            y1: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 0),
            x2: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 100),
            y2: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 100),
        }, object); //set a few defaults

        const x1 = obj.x1.get("x", canvas);
        const y1 = obj.y1.get("y", canvas);
        const x2 = obj.x2.get("x", canvas);
        const y2 = obj.y2.get("y", canvas);

        ctx.beginPath();
        ctx.moveTo(
            x1,
            y1
        );
        ctx.lineTo(
            x2,
            y2
        );
        ctx.stroke();
    }

    circle(ctx, canvas, object) {
        const obj = Object.assign({
            x: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 0),
            y: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 0),
            radius: new CanvasSupplier(CanvasSupplier.Type.NUMBER, 100),
            filled: new CanvasSupplier(CanvasSupplier.Type.STRING, "false"),
        }, object)

        const isFilled = obj.filled.get("filled", canvas) == "true" || obj.filled.get("filled", canvas) == true;

        const x = obj.x.get("x", canvas);
        const y = obj.y.get("y", canvas);
        const radius = obj.radius.get("radius", canvas);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        if (isFilled) {
            ctx.fill();
        } else {
            ctx.stroke();
        }
    }
}

export default CanvasProcess;