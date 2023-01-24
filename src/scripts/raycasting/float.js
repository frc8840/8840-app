
class Float2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    subtract(other) {
        return float2(this.x - other.x, this.y - other.y);
    }
    add(other) {
        return float2(this.x + other.x, this.y + other.y);
    }
    multiply(other) {
        return float2(this.x * other.x, this.y * other.y);
    }
    scalar(num) {
        return float2(this.x * num, this.y * num);
    }
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }
    rotate(radians) {
        let cos = Math.cos(radians);
        let sin = Math.sin(radians);
        return float2(this.x * cos - this.y * sin, this.x * sin + this.y * cos);
    }
    dist(other) {
        return this.subtract(other).length();
    }
    length() {
        return Math.sqrt(this.dot(this));
    }
}

class Float3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    subtract(other) {
        return float3(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    add(other) {
        return float3(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    multiply(other) {
        return float3(this.x * other.x, this.y * other.y, this.z * other.z);
    }
    scalar(num) {
        return float3(this.x * num, this.y * num, this.z * num);
    }
    dot(other) {
        return this.x * other.x + this.y * other.y + this.z * other.z;
    }
    length() {
        return Math.sqrt(this.dot(this));
    }
}

function float2(x, y) {
    return new Float2(x, y)
}

function float3(x, y, z) {
    return new Float3(x, y, z);
}

function translate(samplePosition=float2(0,0), offset=float2(0,0)) {
    if (!(samplePosition instanceof Float2 && offset instanceof Float2)) {
        if (!(samplePosition instanceof Float3 && offset instanceof Float3)) {
            throw new TypeError("translate: samplePosition and offset must be of the same type");
        }
    }
    
    return samplePosition.subtract(offset);
}

function rotate(samplePosition=float2(0,0), rotation=0) {
    let angle = rotation * Math.PI * 2 * -1;

    let sine = Math.sin(angle);
    let cosine = Math.cos(angle);

    return float2(cosine * samplePosition.x + sine * samplePosition.y, cosine * samplePosition.y - sine * samplePosition.x);
}

export default {
    float2,
    float3,
}

export {
    float2,
    float3,
    translate,
    rotate,
    Float2,
    Float3
}