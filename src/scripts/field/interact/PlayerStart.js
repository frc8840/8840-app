import dist from "../../misc/dist";
import { float2 } from "../../raycasting/float";
import { dimensions } from "./Player";
import { Unit } from "../../misc/unit";

import { save, load } from "../../save/SaveManager";

class PlayerStart {
    static diameter = 8;

    constructor(pos=float2(0,0), center=float2(0,0), team=0) {
        this.x = pos.x;
        this.y = pos.y;
        this.centerX = center.x;
        this.centerY = center.y;
        this.team = team;
        this.teamColor = team == 0 ? "blue" : "red";
    }
    draw(ctx, i2p, mouse, drawRobot) {
        ctx.fillStyle = this.teamColor;
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;

        if (dist(mouse.x, mouse.y, this.x, this.y) < PlayerStart.diameter / 2) {
            ctx.fillStyle = "green";
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, PlayerStart.diameter, 0, 2 * Math.PI);
        ctx.stroke();
        ctx.fill();

        if (drawRobot) {
            ctx.save();
            
            ctx.strokeStyle = "black";

            ctx.translate(this.x, this.y);

            //Face towards the middle
            ctx.rotate(Math.atan2(this.centerY - this.y, this.centerX - this.x) - Math.PI/2);
            ctx.beginPath();
            ctx.moveTo(dimensions.width.getcu(i2p, Unit.Type.INCHES) / 2, dimensions.length.getcu(i2p, Unit.Type.INCHES) / 2);
            ctx.lineTo(-dimensions.width.getcu(i2p, Unit.Type.INCHES) / 2, dimensions.length.getcu(i2p, Unit.Type.INCHES) / 2);
            ctx.lineTo(-dimensions.width.getcu(i2p, Unit.Type.INCHES) / 2, -dimensions.length.getcu(i2p, Unit.Type.INCHES) / 2);
            ctx.lineTo(dimensions.width.getcu(i2p, Unit.Type.INCHES) / 2, -dimensions.length.getcu(i2p, Unit.Type.INCHES) / 2);
            ctx.lineTo(dimensions.width.getcu(i2p, Unit.Type.INCHES) / 2, dimensions.length.getcu(i2p, Unit.Type.INCHES) / 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, dimensions.length.getcu(i2p, Unit.Type.INCHES) / 2);
            ctx.lineTo(0, dimensions.length.getcu(i2p, Unit.Type.INCHES) / 1.5);
            ctx.stroke();

            ctx.restore();
        }

        ctx.lineWidth = 1;
    }
}

class PlayerStartManager {
    constructor(max, middle={x: 250, y: 250}, radius=100) {
        this.max = max;
        this.starts = [];

        this.held = -1;

        let radiPer = (Math.PI * 2) / max;

        for (let i = 0; i < max; i++) {
            let pos = {
                x: Math.cos(radiPer * i) * radius + middle.x,
                y: Math.sin(radiPer * i) * radius + middle.y
            }
            this.starts.push(new PlayerStart(float2(pos.x, pos.y), middle, i + 1 > Math.floor(max / 2) ? 1 : 0));
        }

        const loaded = load("playerStarts");

        if (loaded !== undefined && loaded !== null) {
            if (typeof loaded == "object") {
                this.starts.forEach((s, i) => {
                    s.x = loaded[i].x;
                    s.y = loaded[i].y;

                    s.team = loaded[i].team;
                })
            }
        }
    }
    draw(ctx, i2p, mouse, keysDown) {
        for (let i = 0; i < this.starts.length; i++) {
            this.starts[i].draw(ctx, i2p, mouse, Object.keys(keysDown).includes("v") ? keysDown.v : false);

            if (dist(mouse.x, mouse.y, this.starts[i].x, this.starts[i].y) < PlayerStart.diameter / 2 && mouse.down) {
                this.held = i;
            }
        }

        if (this.held !== -1) {
            if (!mouse.down) {
                this.held = -1;

                let formatted = [];

                this.starts.forEach(s => {
                    formatted.push({
                        x: s.x,
                        y: s.y,
                        team: s.team
                    })
                })

                save("playerStarts", formatted);

                return;
            }

            this.starts[this.held].x = mouse.x;
            this.starts[this.held].y = mouse.y;
        }
    }
    returnPositions() {
        let blue = [];
        let red = [];

        this.starts.forEach(s => {
            if (s.team == 0) {
                blue.push({
                    x: s.x,
                    y: s.y
                });
            } else {
                red.push({
                    x: s.x,
                    y: s.y
                });
            }
        });

        return {
            blue,
            red,
        }
    }
}

export default PlayerStartManager;