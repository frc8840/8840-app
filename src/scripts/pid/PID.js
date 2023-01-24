
class PID {
    constructor(p=0, i=0, d=0) {
        if (typeof p != "number" || typeof i != "number" || typeof d != "number") {
            throw "PID constructor arguments must be numbers.";
        }
        this.p = p;
        this.i = i;
        this.d = d;

        this.intergral = {
            x: 0,
            y: 0
        }

        this.lastPos = {
            x: 0,
            y: 0,
            used: false
        }
    }
    setP(p) {
        if (typeof p != "number") {
            throw "PID.setP() argument must be a number.";
        }
        this.p = p;
    }
    setI(i) {
        if (typeof i != "number") {
            throw "PID.setI() argument must be a number.";
        }
        this.i = i;
    }
    setD(d) {
        if (typeof d != "number") {
            throw "PID.setD() argument must be a number.";
        }
        this.d = d;
    }
    setPID(p,i,d) {
        if (typeof p != "number" || typeof i != "number" || typeof d != "number") {
            throw "PID.setPID() arguments must be numbers.";
        }
        this.p = p;
        this.i = i;
        this.d = d;
    }
    copy() {
        return new PID(this.p, this.i, this.d);
    }
    reset(lastPos={x: 0, y: 0}) {
        if (!Object.keys(lastPos).includes("x") || !Object.keys(lastPos).includes("y")) {
            throw "PID.reset() lastPos argument must be an object with x and y properties.";
        }

        this.intergral = {
            x: 0,
            y: 0
        }
        this.lastPos = {
            x: lastPos.x,
            y: lastPos.y,
            used: true
        }
    }
    getSimpleMovement(goal=0, position=0, verbose=false, lastPos=this.lastPos.x) {
        if (!this.lastPos.used) {
            this.lastPos.used = true;
        }

        const error = goal - position;
        const derivative = position - lastPos;
        const intergral = this.intergral.x + error;

        if (verbose) {
            console.log(lastPos, goal, position, derivative, intergral)
        }

        const movement = (this.p * error) + (this.i * intergral) - (this.d * derivative);

        this.lastPos = {
            x: position,
            y: 0,
            used: true
        }

        return movement;
    }
    get2DMovement(goal={x:0,y:0}, position={x:0,y:0}, lastPos=this.lastPos) {
        if (typeof goal != "object" || typeof position != "object") {
            throw "PID getMovement arguments must be objects. (x, y)";
        }
        if (!Object.keys(goal).includes("x") || !Object.keys(goal).includes("y")) {
            throw "PID getMovement arguments must have x and y properties.";
        }
        if (!Object.keys(position).includes("x") || !Object.keys(position).includes("y")) {
            throw "PID getMovement arguments must have x and y properties.";
        }
        if (!Object.keys(lastPos).includes("x") || !Object.keys(lastPos).includes("y")) {
            throw "PID getMovement arguments must have x and y properties.";
        }

        if (!this.lastPos.used) {
            this.lastPos = {
                x: position.x,
                y: position.y,
                used: true
            }
        }

        const error = {
            x: goal.x - position.x,
            y: goal.y - position.y
        }

        const derivative = {
            x: position.x - lastPos.x,
            y: position.y - lastPos.y
        }

        const intergral = {
            x: this.intergral.x + error.x,
            y: this.intergral.y + error.y
        }

        const movement = {
            x: (this.p * error.x) + (this.i * intergral.x) - (this.d * derivative.x),
            y: (this.p * error.y) + (this.i * intergral.y) - (this.d * derivative.y)
        }

        this.lastPos = {
            x: position.x + movement.x,
            y: position.y + movement.y,
            used: true
        }

        return movement;
    }
}

export default PID;