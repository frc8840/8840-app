
class Angle {
    static Radians = 0;
    static Degrees = 1;
    static Type = { //just for consistency with copilot and unit.type
        RADIANS: 0,
        Radians: 0,
        DEGREES: 1,
        Degrees: 1,
    }
    constructor(value, unit) {
        this.value = value;
        this.unit = unit;
    }
    
    get(unit=this.unit) {
        if (unit == this.unit) {
            return this.value;
        } else {
            return unit == Angle.Radians ? Angle.toRadians(this.value) : Angle.toDegrees(this.value);
        }
    }

    add(angle) {
        if (typeof angle == "number") {
            this.value += angle;
        } else if (angle instanceof Angle) {
            this.value += angle.get(this.unit);
        } else {
            throw "Cannot add " + angle + " to " + this;
        }
    }

    subtract(angle) {
        if (typeof angle == "number") {
            this.value -= angle;
        } else if (angle instanceof Angle) {
            this.value -= angle.get(this.unit);
        } else {
            throw "Cannot subtract " + angle + " to " + this;
        }
    }
    
    static toRadians(angle) {
        return angle * (Math.PI / 180);
    }
    static toDegrees(angle) {
        return angle * (180 / Math.PI);
    }

    static normalize(angle_=new Angle(0, Angle.Radians)) {
        const angle = angle_.get(Angle.Degrees);
        if (angle >= 0 && angle < 360) {
            return angle_;
        }

        let normalized = angle % 360;

        if (normalized < 0) {
            normalized += 360;
        }
        
        return new Angle(normalized, Angle.Degrees);
    }
}

class Unit {
    static Type = {
        PIXELS: 0,
        INCHES: 1,
        FEET: 2,
        METERS: 3,
        CENTIMETERS: 4,
        MILLIMETERS: 5,
        YARDS: 6,
    }
    //Converting from centimeters to the other units
    static Conversions = {
        [Unit.Type.PIXELS]: 0, //Can't convert to pixels because pixels are pixels.
        [Unit.Type.INCHES]: 0.393701, //Centimeters to inches
        [Unit.Type.FEET]: 0.0328084, //Centimeters to feet
        [Unit.Type.METERS]: 0.01, //Centimeters to meters
        [Unit.Type.CENTIMETERS]: 1, //Centimeters to centimeters
        [Unit.Type.MILLIMETERS]: 10, //Centimeters to millimeters
        [Unit.Type.YARDS]: 0.0109361, //Centimeters to yards
    }
    constructor(value=0, unit=Unit.Type.PIXELS) {
        this.unit = unit;

        this.set(value);
    }
    set(value) {
        this.rawValue = value;
        this.centimeterConversion = Unit.Conversions[this.unit];
        this.inCentimeters = this.rawValue / this.centimeterConversion;
    }
    to(unit=this.unit) {
        return this.get(unit);
    }
    get(unit=this.unit) {
        return this.inCentimeters * Unit.Conversions[unit];
    }
    getc(customUnit=1) {
        return this.value * customUnit;
    }
    getcu(customUnit=1, unit=this.unit) {
        return this.get(unit) * customUnit;
    }
    add(value, unit=this.unit) {
        if (value instanceof Unit) {
            this.set(this.get() + value.get(this.unit));
        } else {
            this.set(this.get() + new Unit(value, unit).get(this.unit));
        }
    }
}

export default {Unit, Angle};
export {Unit, Angle}