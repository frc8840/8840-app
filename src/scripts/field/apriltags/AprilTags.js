
import { Angle, Unit } from "../../misc/unit";

import dist from "../../misc/dist";
import { save, load } from "../../save/SaveManager";

class AprilTag {
    constructor(id, x, y, angle, size) {
        this.id = id || 0;
        this.x = x || 0;
        this.y = y || 0;
        if (typeof angle === "number") {
            this.rotation = new Angle(angle, Angle.Radians);
        } else this.rotation = angle || new Angle(0, Angle.Radians);
        if (typeof size === "number") {
            this.size = new Unit(size, Unit.Type.INCHES);
        } else {
            this.size = size || new Unit(0, Unit.Type.INCHES);
        }
    }
    draw(i2p, ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 10, 0, 2 * Math.PI);
        ctx.stroke();

        const width = this.size.getcu(i2p, Unit.Type.INCHES);
        const height = 3;

        ctx.save();
        ctx.translate(this.x, this.y);
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
    constructor(i2p) {
        this.i2p = i2p;

        this.tags = [
            new AprilTag(0, 0, 0, new Angle(0, Angle.Degrees), new Unit(8, Unit.Type.INCHES)),
            new AprilTag(1, 0, 0, new Angle(0, Angle.Degrees), new Unit(8, Unit.Type.INCHES)),
        ];

        this.mouseInfo = {
            indexHeld: 0,
            offset: {
                x: 0,
                y: 0,
            },
        };
        this.ableToEdit = true;
        this.editTagRotationTimestamp = 0;
        this.lastSave = 0;
        this.loadAprilTags();
    }
    saveAprilTags() {
        const toBeSaved = [];
        for (let tag of this.tags) {
            toBeSaved.push({
                id: tag.id,
                x: tag.x / this.i2p,
                y: tag.y / this.i2p,
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

            if (this.mouseInfo.indexHeld < 0 && dist(tag.x, tag.y, mouse.x, mouse.y) < 10) {
                ctx.fillStyle = "white";
                ctx.font = "20px Arial";
                ctx.fillText("Tag " + tag.id, 10, 50);
                ctx.fillStyle = "white";
    
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
    
            if (mouse.down && dist(tag.x, tag.y, mouse.x, mouse.y) < 10 && this.mouseInfo.indexHeld < 0) {
                this.mouseInfo.indexHeld = index;
                this.mouseInfo.offset.x = tag.x - mouse.x;
                this.mouseInfo.offset.y = tag.y - mouse.y;
                this.lastSave = 0;
            } else if (!mouse.down && dist(tag.x, tag.y, mouse.x, mouse.y) < 10 && this.mouseInfo.indexHeld < 0) {
                if (Date.now() - this.lastSave > 500) {
                    this.saveAprilTags();
                    this.lastSave = Date.now();
                }
            }

            index++;
        }
    }
}

export default AprilTagManager;