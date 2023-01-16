
import { Angle, Unit } from "../../misc/unit";

import dist from "../../misc/dist";
import { save, load } from "../../save/SaveManager";

import { chargedUp } from "../Field";

const defaultSize = new Unit(8, Unit.Type.INCHES);

class AprilTag {
    /**
     * Creates a new april tag.
     * @param {Number} id The ID Number of the tag.
     * @param {Number | Unit} x The x coordinate of the tag.
     * @param {Number | Unit} y The y coordinate of the tag.
     * @param {Number | Unit} z The z coordinate of the tag.
     * @param {Angle} angle The angle of the tag.
     * @param {Unit} size The size of the tag (i.e the side length of the square)
     * @param {boolean} accurateToRealField Whether the measurements and everything is accurate to the real world.
     *                                If true, the y coordinate will be flipped and the angle will have 90 degrees subtracted from it.
     *                                (Due to the canvas coordinate system being different from the real world coordinate system)
     */
    constructor(id, x, y, z, angle, size=defaultSize, accurateToRealField=false) {
        this.id = id || 0;
        this.x = x || 0;
        this.y = y || 0;
        this.z = z || 0;
        if (typeof angle === "number") {
            this.rotation = new Angle(angle, Angle.Radians);
        } else this.rotation = angle || new Angle(0, Angle.Radians);
        if (typeof size === "number") {
            this.size = new Unit(size, Unit.Type.INCHES);
        } else {
            this.size = size || new Unit(0, Unit.Type.INCHES);
        }

        this.accurateToRealField = accurateToRealField;

        this.init();
    }
    init() {
        //Just set a timeout since the field may not be initialized yet.
        setTimeout(() => {
            if (this.accurateToRealField) {
                this.y = new Unit(chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES) - (typeof this.y == "object" ? this.y.get(Unit.Type.INCHES) : this.y), Unit.Type.INCHES);
                this.rotation = new Angle(this.rotation.get(Angle.Degrees) - 90, Angle.Degrees);

            }
        }, 50)
    }
    draw(i2p, ctx) {
        ctx.beginPath();
        if (typeof this.x == "object") {
            ctx.arc(this.x.getcu(i2p, Unit.Type.INCHES), this.y.getcu(i2p, Unit.Type.INCHES), 10, 0, 2 * Math.PI);
        } else {
            ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
        }
        ctx.stroke();

        const width = this.size.getcu(i2p, Unit.Type.INCHES);
        const height = 3;

        ctx.save();
        if (typeof this.x == "object") {
            ctx.translate(this.x.getcu(i2p, Unit.Type.INCHES), this.y.getcu(i2p, Unit.Type.INCHES));
        } else {
            ctx.translate(this.x, this.y);
        }
        ctx.rotate(this.rotation.get(Angle.Radians));
        ctx.beginPath();
        ctx.lineTo(width / -2, height / 2);
        ctx.lineTo(width / -2, -height / 2);
        ctx.lineTo(width / 2, -height / 2);
        ctx.lineTo(width / 2, height / 2);
        ctx.lineTo(width / -2, height / 2);
        ctx.lineTo(-1, height / 2);
        ctx.lineTo(-1, 20);
        ctx.lineTo(1, 20);
        ctx.lineTo(1, height / 2);
        ctx.stroke();
        ctx.restore();
    }
    
    static fromObject(obj, i2p) {
        return new AprilTag(obj.id, obj.x * i2p, obj.y * i2p, obj.rotation, obj.size);
    }
}

class AprilTagManager {
    constructor(i2p, tags=[], tagsAreLocked=false) {
        this.i2p = i2p;

        this.tags = tags.length > 0 ? tags : [
            new AprilTag(0, 0, 0, 0, new Angle(0, Angle.Degrees), new Unit(8, Unit.Type.INCHES)),
            new AprilTag(1, 0, 0, 0, new Angle(0, Angle.Degrees), new Unit(8, Unit.Type.INCHES)),
        ];

        this.mouseInfo = {
            indexHeld: 0,
            offset: {
                x: 0,
                y: 0,
            },
        };

        this.tagsAreLocked = tagsAreLocked;

        this.ableToEdit = true;
        this.editTagRotationTimestamp = 0;
        this.lastSave = 0;

        if (!tagsAreLocked) this.loadAprilTags();
    }
    saveAprilTags() {
        const toBeSaved = [];
        for (let tag of this.tags) {
            const x = typeof tag.x == "object" ? tag.x.get(Unit.Type.INCHES) : tag.x / this.i2p;
            const y = typeof tag.y == "object" ? tag.y.get(Unit.Type.INCHES) : tag.y / this.i2p;
            const z = typeof tag.z == "object" ? tag.z.get(Unit.Type.INCHES) : tag.z / this.i2p;

            toBeSaved.push({
                id: tag.id,
                x,
                y,
                z,
                rotation: tag.rotation.get(Angle.Radians),
                size: tag.size.get(Unit.Type.INCHES),
            });
        }
        // window.localStorage.setItem("aprilTags", JSON.stringify(toBeSaved));
        save("aprilTags", toBeSaved)
    }
    loadAprilTags() {
        const aprilTags = load("aprilTags"); //window.localStorage.getItem("aprilTags");
        if (aprilTags) {
            const savedTags = aprilTags;
            this.tags = [];
            for (let i = 0; i < savedTags.length; i++) {
                this.tags.push(AprilTag.fromObject(savedTags[i], this.i2p));
            }
        }
    }
    draw(keysDown={}, ctx, mouse) {
        const i2p = this.i2p;

        let index = 0;
        for (let tag of this.tags) {
            tag.draw(i2p, ctx)

            const tagX = typeof tag.x == "object" ? tag.x.getcu(i2p, Unit.Type.INCHES) : tag.x;
            const tagY = typeof tag.y == "object" ? tag.y.getcu(i2p, Unit.Type.INCHES) : tag.y;

            if (this.mouseInfo.indexHeld < 0 && dist(tagX, tagY, mouse.x, mouse.y) < 10) {
                ctx.fillStyle = "white";
                ctx.font = "20px Arial";
                ctx.fillText("Tag " + tag.id, 10, 50);
                ctx.fillStyle = "white";
                
                if (!this.tagsAreLocked) {
                    if (!mouse.down && (keysDown ? keysDown["e"] : false) && this.editTagRotationTimestamp < Date.now() - 200) {
                        if (this.ableToEdit) {
                            this.editTagRotationTimestamp = Date.now();

                            const newAngle = prompt(`Enter new angle for tag ${tag.id} in degrees (current degrees: ${tag.rotation.get(Angle.Degrees)})`);
                            if (newAngle != null) {
                                tag.rotation = new Angle(parseFloat(newAngle) || 0, Angle.Degrees);
                                this.saveAprilTags();
                            }
                            keysDown.remove("e");
                            this.editTagRotationTimestamp = Date.now();
                            this.ableToEdit = false;
                        } else {
                            this.ableToEdit = true;
                            keysDown.remove("e");
                        }
                    }
                }
            }
            
            if (!this.tagsAreLocked) {
                if (mouse.down && dist(tagX, tagY, mouse.x, mouse.y) < 10 && this.mouseInfo.indexHeld < 0) {
                    this.mouseInfo.indexHeld = index;
                    this.mouseInfo.offset.x = tagX - mouse.x;
                    this.mouseInfo.offset.y = tagY - mouse.y;
                    this.lastSave = 0;
                } else if (!mouse.down && dist(tagX, tagY, mouse.x, mouse.y) < 10 && this.mouseInfo.indexHeld < 0) {
                    if (Date.now() - this.lastSave > 500) {
                        this.saveAprilTags();
                        this.lastSave = Date.now();
                    }
                }
            }

            index++;
        }
    }
}

export default AprilTagManager;
export { AprilTagManager, AprilTag };