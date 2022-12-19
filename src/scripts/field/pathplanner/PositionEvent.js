import dist from "../../misc/dist";
import { Angle, Unit } from "../../misc/unit";
import { dimensions } from "../interact/Player";

class PositionEvent {
    static Type = {
        Rotation: 1,
    }

    static PrimaryValueNameStorage = {
        1: "rotation",
    }

    static PrimaryValueProcess = {
        1: (value) => {
            //Transform the degrees into an angle object.
            return new Angle(value, Angle.Degrees)
        }
    }

    static Defaults = {
        1: {
            rotation: new Angle(0, Angle.Radians)
        }
    }

    constructor(x, y, type, data, percentReference) {
        this.x = x;
        this.y = y;
        this.type = type;

        this.percentReference = percentReference;

        this.data = Object.assign(Object.assign({}, PositionEvent.Defaults[this.type]), data);
    }

    readjustPosition(path) {
        //Find current maximium index
        let highestIndex = 0;
        path.forEach(segment => {
            highestIndex += segment.length;
        })

        //Figure out goal index
        let goalIndex = Math.round(this.percentReference * highestIndex);
    }

    readjustReference(path) {
        let closestPoint = {x: 0, y: 0, indexOnPath: 0};
        let closestPointDistance = 9999999;
        let highestIndex = 0;

        for (let i = 0; i < path.length; i++) {
            const segment = path[i];
            for (let j = 0; j < segment.length; j++) {
                const distBetween = dist(segment[j].x, segment[j].y, this.x, this.y);
                if (distBetween < closestPointDistance) {
                    closestPoint = {
                        x: segment[j].x,
                        y: segment[j].y,
                        indexOnPath: Number(highestIndex)
                    }
                }

                highestIndex++;
            }
        }

        this.percentReference = closestPoint.indexOnPath / highestIndex;
    }

    draw(i2p, ctx, color) {
        ctx.save();
        
        ctx.strokeStyle = color;

        ctx.translate(this.x, this.y);

        if (this.type == PositionEvent.Type.Rotation) {
            ctx.rotate(this.data.rotation.get(Angle.Radians));
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
        }

        ctx.restore();

        ctx.strokeStyle = "black";
    }
}

export default PositionEvent;