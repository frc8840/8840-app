import { Angle } from "../misc/unit";

import circleIntersectsWithTriangle from "../misc/intersect";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
function generatePhysicalKey(l=8) {
    if (!global.physical_keys) global.physical_keys = [];

    let key = "";
    do {
        key = "";
        for (let i = 0; i < l; i++) {
            key += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
    } while (global.physical_keys.includes(key));

    global.physical_keys.push(key);
    return key;
}


class Physical {
    static Type = {
        CIRCLE: 0,
        RECTANGLE: 1,
    }
    constructor(pos={x: 0, y: 0, vel: 0, dir: 0}, type=Physical.Type.RECTANGLE, size={w: 0, h: 0, r: 0}, rotation=new Angle(0, Angle.Degrees), board="default_game") {
        this.pos = {
            x: pos.x || 0,
            y: pos.y || 0,
            vel: pos.vel || 0,
            dir: pos.dir || 0,
        };
        this.type = type;
        this.size = size;

        this.rotation = rotation;

        this.board = board;
        
        this.lastInteraction = ""; //just for bug issues w/ physics.

        this.physical_key = generatePhysicalKey();

        if (!global.physObjs) global.physObjs = {};
        if (!global.physObjs[this.board]) global.physObjs[this.board] = [];

        global.physObjs[this.board].push(this);

        let center = {
            x: pos.x + size.w / 2,
            y: pos.y + size.h / 2,
        }

        let angle = rotation.get(Angle.Radians);

        const cos = Math.cos;
        const sin = Math.sin;

        let width = this.size.w || 0;
        let height = this.size.h || 0;

        this.realPositions = type == Physical.Type.CIRCLE ? {
            x: pos.x,
            y: pos.y,
        } : { //Create a rectangle but rotate it to the angle
            topLeft: {
                x: pos.x + ((width / 2) * cos(angle)) - ((height / 2) * sin(angle)),
                y: pos.y + ((width / 2) * sin(angle)) + ((height / 2) * cos(angle)),
            },
            topRight: {
                x: pos.x + (-(width / 2) * cos(angle)) - ((height / 2) * sin(angle)),
                y: pos.y + (-(width / 2) * sin(angle)) + ((height / 2) * cos(angle)),
            },
            bottomRight: {
                x: pos.x + (-(width / 2) * cos(angle)) - (-(height / 2) * sin(angle)),
                y: pos.y + (-(width / 2) * sin(angle)) + (-(height / 2) * cos(angle)),
            },
            bottomLeft: {
                x: pos.x + ((width / 2) * cos(angle)) - (-(height / 2) * sin(angle)),
                y: pos.y + ((width / 2) * sin(angle)) + (-(height / 2) * cos(angle)),
            },
        };
    }

    draw(ctx) {
        if (this.type == Physical.Type.CIRCLE) {
            ctx.beginPath();
            ctx.arc(
                this.pos.x,
                this.pos.y,
                this.size.r,
                0, 2 * Math.PI
            )
            ctx.stroke();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(this.realPositions.topLeft.x, this.realPositions.topLeft.y);
            ctx.lineTo(this.realPositions.topRight.x, this.realPositions.topRight.y);
            ctx.lineTo(this.realPositions.bottomRight.x, this.realPositions.bottomRight.y);
            ctx.lineTo(this.realPositions.bottomLeft.x, this.realPositions.bottomLeft.y);
            ctx.stroke();
            ctx.fill();
        }
    }

    /**
     * 
     * @param {Physical} other 
     */
    checkCollision(other, getSide=false) {
        if (!(other instanceof Physical)) {
            throw "Other needs to be a physical object";
        }

        if (this.type == Physical.Type.RECTANGLE) {
            if (other.type == Physical.Type.CIRCLE) {
                let triangle1 = [this.realPositions.topLeft, this.realPositions.topRight, this.realPositions.bottomRight];
                let triangle2 = [this.realPositions.bottomRight, this.realPositions.bottomLeft, this.realPositions.topLeft];

                let firstIntersection = circleIntersectsWithTriangle(other.pos, other.size.r, ...triangle1);
                let secondIntersection = circleIntersectsWithTriangle(other.pos, other.size.r, ...triangle2);

                if (getSide) {
                    if (!firstIntersection.collision && !secondIntersection.collision) return {collision: false, side: null};
                    
                    return firstIntersection.collision ? firstIntersection : secondIntersection;
                }

                return firstIntersection.collision || secondIntersection.collision;
            } else if (other.type == Physical.Type.RECTANGLE) {
                //TODO: Implement rectangle collision
            }
        } else if (this.type == Physical.Type.CIRCLE) {
            if (other.type == Physical.Type.CIRCLE) {
                if (Math.sqrt(Math.pow(this.pos.x - other.pos.x, 2) + Math.pow(this.pos.y - other.pos.y, 2)) <= this.radius + other.radius) {
                    return true;
                }
            } else if (other.type == Physical.Type.RECTANGLE) {
                let triangle1 = [other.realPositions.topRight, other.realPositions.topLeft, other.realPositions.bottomRight];
                let triangle2 = [other.realPositions.topLeft, other.realPositions.bottomRight, other.realPositions.bottomLeft];

                return circleIntersectsWithTriangle(this.pos, this.size.r, ...triangle1).collision || circleIntersectsWithTriangle(this.pos, this.size.r, ...triangle2).collision;
            }
        }
    }


    angleOfWall(side=0) {
        if (this.type == Physical.Type.RECTANGLE) {
            if (side == 0) {
                return new Angle(Math.atan2(this.realPositions.topRight.y - this.realPositions.topLeft.y, this.realPositions.topRight.x - this.realPositions.topLeft.x), Angle.Radians);
            } else if (side == 3) {
                return new Angle(Math.atan2(this.realPositions.bottomRight.y - this.realPositions.topRight.y, this.realPositions.bottomRight.x - this.realPositions.topRight.x), Angle.Radians);
            } else if (side == 2) {
                return new Angle(Math.atan2(this.realPositions.bottomLeft.y - this.realPositions.bottomRight.y, this.realPositions.bottomLeft.x - this.realPositions.bottomRight.x), Angle.Radians);
            } else if (side == 1) {
                return new Angle(Math.atan2(this.realPositions.topLeft.y - this.realPositions.bottomLeft.y, this.realPositions.topLeft.x - this.realPositions.bottomLeft.x), Angle.Radians);
            }
        } else return null;
    }

    SignedDistanceTriangle(x,y,triangle) {
        let v0 = {
            x: triangle[2].x - triangle[0].x,
            y: triangle[2].y - triangle[0].y,
        }
        let v1 = {
            x: triangle[1].x - triangle[0].x,
            y: triangle[1].y - triangle[0].y,
        }
        let v2 = {
            x: x - triangle[0].x,
            y: y - triangle[0].y,
        }
        
        let dot00 = (v0.x * v0.x) + (v0.y * v0.y);
        let dot01 = (v0.x * v1.x) + (v0.y * v1.y);
        let dot02 = (v0.x * v2.x) + (v0.y * v2.y);
        let dot11 = (v1.x * v1.x) + (v1.y * v1.y);
        let dot12 = (v1.x * v2.x) + (v1.y * v2.y);

        let invDenom = 1 / (dot00 * dot11 - dot01 * dot01);

        let u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        let v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1);
        //source: https://stackoverflow.com/questions/2049582/how-to-determine-if-a-point-is-in-a-2d-triangle
    }

    getSignedDistance(x,y) {
        if (this.type == Physical.Type.CIRCLE) {
            return Math.sqrt(Math.pow(this.pos.x - x, 2) + Math.pow(this.pos.y - y, 2)) - this.size.r;
        } else if (this.type == Physical.Type.RECTANGLE) {
            //split it up into two triangles
            let triangle1 = {
                p1: this.realPositions.topLeft,
                p2: this.realPositions.topRight,
                p3: this.realPositions.bottomLeft,
            }
            let triangle2 = {
                p1: this.realPositions.topRight,
                p2: this.realPositions.bottomRight,
                p3: this.realPositions.bottomLeft,
            }
            
            //get the signed distance of each triangle
            let signedDistance1 = this.getSignedDistanceTriangle(x,y,triangle1);
            let signedDistance2 = this.getSignedDistanceTriangle(x,y,triangle2);

            //return the smallest one
            return Math.min(signedDistance1, signedDistance2);
        }
    }
}

class Ball extends Physical {
    constructor(x, y, color, radius) {
        super({
            x,y
        }, Physical.Type.CIRCLE, {r: radius});

        this.pos = {
            x,
            y,
            dir: 0,
            vel: 0,
        }

        this.radius = radius;

        this.color = color;

        this.held = false;
    }
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
            this.pos.x,
            this.pos.y,
            this.radius,
            0, 2 * Math.PI
        )
        ctx.stroke();
        ctx.fill();
        ctx.lineWidth = 1;
    }
    move(dontMove=false) {
        let closestDistance = Infinity;
        let closestObj = null;
        for (let i = 0; i < global.physObjs[this.board].length; i++) {
            let other = global.physObjs[this.board][i];
            if (other.physical_key == this.physical_key) continue;

            let distance = other.type == Physical.Type.CIRCLE ?
             this.getSignedDistance(other.pos.x, other.pos.y) - other.size.r :
             (other.checkCollision(this) ? -1 : Infinity);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestObj = other;
            }
        }

        let doBounceOffWall = false;

        if (closestDistance < 0) {
            //collision
            if (closestObj.hit) {
                closestObj.hit(this);
            } else {
                if (this.lastInteraction != closestObj.physical_key) {
                    doBounceOffWall = true;
                }
            }

            this.lastInteraction = closestObj.physical_key;
        }
        
        if (!dontMove) {
            if (doBounceOffWall) {
                let side = closestObj.checkCollision(this, true).between;
                const angleOfWall = Angle.normalize(closestObj.angleOfWall(side > 0 ? 1 : 0));

                const angleOfBall = Angle.normalize(new Angle(this.pos.dir + Math.PI, Angle.Radians));

                const difference = Angle.normalize(new Angle(angleOfWall.get(Angle.Radians) - angleOfBall.get(Angle.Radians), Angle.Radians));

                //this.pos.dir += angleOfWall.get(Angle.Radians) + difference.get(Angle.Radians);
                this.pos.dir += Math.PI + (Math.PI - (difference.get(Angle.Radians) * 2));
                // if (side == 0) {
                //     let lowerBound = angleOfWall.get(Angle.Radians);
                //     let upperBound = angleOfWall.get(Angle.Radians) + Math.PI;

                //     let top = angleOfBall > lowerBound && angleOfBall < upperBound;

                //     const normalized = Math.abs(angleOfWall.get(Angle.Radians) - angleOfBall.get(Angle.Radians));

                //     console.log(normalized, top, angleOfWall, angleOfBall)

                //     this.pos.dir = normalized - angleOfWall.get(Angle.Radians)
                // } else if (side == 1) {
                //     let lowerBound = angleOfWall.get(Angle.Radians) - Math.PI;
                //     let upperBound = angleOfWall.get(Angle.Radians);

                //     let top = angleOfBall > lowerBound && angleOfBall < upperBound;

                //     const normalized = Math.abs(angleOfWall.get(Angle.Radians) - angleOfBall.get(Angle.Radians));

                //     console.log(normalized, top, angleOfWall, angleOfBall)

                //     this.pos.dir = normalized + angleOfWall.get(Angle.Radians)
                // }
            }

            this.pos.x += this.pos.vel * Math.cos(this.pos.dir);
            this.pos.y += this.pos.vel * Math.sin(this.pos.dir);
            if (this.pos.vel < 0.005) {
                this.pos.vel = 0;
            }
            this.pos.vel *= 0.99;
        }
    }
    hit(physicsObj) {
        if (!(physicsObj instanceof Physical)) throw "not physical.";

        let hitterPos = physicsObj.pos;

        //Calculate direction of hit
        const dir = Math.atan2(this.pos.y - hitterPos.y, this.pos.x - hitterPos.x);
        //Calculate velocity of hit
        const vel = Math.abs(hitterPos.vel || 0.001);
        //Calculate the direction by using a weighted average of the two directions
        const newDir = (this.pos.dir * this.pos.vel + dir * vel) / (this.pos.vel + vel);
        //Calculate the velocity by using a weighted average of the two velocities
        const newVel = (this.pos.vel + vel) / 2;

        const differenceBetweenVel = Math.abs(newVel - vel);
        //Set the new direction and velocity
        this.pos.dir = newDir;
        this.pos.vel = newVel;

        //get percent of difference between velocities
        const percentDifference = differenceBetweenVel / vel;
        physicsObj.pos.vel *= 1 - percentDifference;
        //Loss from heat transfer, don't want to do the full calculation, but i'll apply ~5% loss
        physicsObj.pos.vel *= 0.95;
    }
}

export default {Ball, Physical};

export {Ball, Physical};