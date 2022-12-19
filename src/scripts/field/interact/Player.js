import { NeuralNetwork, Activation } from "../../ai/nn.js";
import { Angle, Unit } from "../../misc/unit.js";

const dimensions = {
    width: new Unit(30, Unit.Type.INCHES),
    length: new Unit(30, Unit.Type.INCHES)
}

class Player {
    constructor() {
        this.pos = {x: 0, y: 0}
        this.rotation = new Angle(0, Angle.Radians);

        /**
         * Input nodes:
         * 1: X position (0-1)
         * 2: Y position (0-1)
         * 3: Front sensor 1
         * 4: Front sensor 2
         * 5: Back sensor 1
         * 6: Back sensor 2
         * 7: Left sensor 1
         * 8: Left sensor 2
         * 9: Right sensor 1
         * 10: Right sensor 2
         * 11: Distance to closest (team) ball
         * 12: Distance to closest (enemy) ball
         * 13: Distance to closest (team) player
         * 14: Distance to closest (enemy) player
         */

        /**
         * Output nodes:
         * 1: Forward
         * 2: Backward
         * 3: Left
         * 4: Right
         * 5: Shoot
         */

        this.nn = new NeuralNetwork(
            14, //Input ndoes
            [1], //Hidden nodes/layers
            5, //Output nodes
            0.01, //Learning rate
            Activation().sigmoid
        );
    }
    draw(i2p, ctx) {
        //Draw rectangle at robot position
        ctx.save();
        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation.get(Angle.Radians));
        ctx.fillRect(0,0, dimensions.width.getcu(i2p, Unit.Type.INCHES), dimensions.length.getcu(i2p, Unit.Type.INCHES))
        ctx.restore();

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 10, 0, 2 * Math.PI);
        ctx.stroke();        
    }
}

export default Player;

export { dimensions };