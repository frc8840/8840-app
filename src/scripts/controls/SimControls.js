import React from "react";
import Canvas from "../canvas/Canvas";
import dist from "../misc/dist";
import { Angle } from "../misc/unit";
import Mover from "../mover/Mover";

import { putValue } from "../pynetworktables2js/wrapper";

window.simControlsID = (function*() {
    let idN = 0;
    
    while (true) {
        idN++;
        yield `simControl${idN}`;
    }
})();

const simControlsTab = "simcontrols";

class SimControls extends React.Component {
    static Type = {
        Joystick: "Joystick",
        Button: "Button",
        Rotation: "Rotation",
        FOV: "FOV"
    }

    constructor(props) {
        super(props);

        this.state = {
            type: Object.keys(SimControls.Type).includes(props["type"] || "") ? props["type"] : SimControls.Type.Joystick,
            joystick: {
                x: 50,
                y: 50,
                sticky: false
            },
            button: {
                length: 10,
                list: new Array(10).fill(false)
            },
            rotation: {
                angle: new Angle(0, Angle.Degrees)
            },
            fov: {
                segments: 8,
                degrees: new Angle(-1, Angle.Degrees)
            },
            id: window.simControlsID.next().value,
            routineUpdateInterval: 0,
        }

        this.state.routineUpdateInterval = setInterval(() => {
            if (this.state.type == SimControls.Type.Joystick) {
                //Put joystick values
                putValue(simControlsTab, "joystick/x", ((this.state.joystick.x / 50) - 1));
                putValue(simControlsTab, "joystick/y", -((this.state.joystick.y / 50) - 1));
            } else if (this.state.type == SimControls.Type.Rotation) {
                //Put rotation value
                putValue(simControlsTab, "rotation/angle", this.state.rotation.angle.get(Angle.Degrees))
            } else if (this.state.type == SimControls.Type.FOV) {
                //Put FOV value
                putValue(simControlsTab, "fov/angle", this.state.fov.degrees.get(Angle.Degrees))
            }
        }, 20)

        console.log("[SimControls] Set update interval to 20ms.");
    }

    draw(ctx, frameCount, rel, canvas, mouse) {
        ctx.clearRect(0,0,100,100);

        this[`draw${this.state.type}`].bind(this)(ctx, mouse);
    }

    drawJoystick(ctx, mouse) {
        ctx.fillStyle = "rgb(31,28,37)"
        ctx.fillRect(0,0,100,100)

        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        for (let x = -50; x <= 50; x += 10) {
            ctx.beginPath();
            ctx.moveTo(x + 50, 0);
            ctx.lineTo(x + 50, 100);
            ctx.stroke();
        }
        for (let y = -50; y <= 50; y += 10) {
            ctx.beginPath();
            ctx.moveTo(0, y + 50);
            ctx.lineTo(100, y + 50);
            ctx.stroke();
        }

        ctx.fillStyle = "orange";

        ctx.beginPath();
        ctx.arc(50, 50, 2, 0, Math.PI * 2);
        ctx.fill();

        if (mouse.down) {
            this.state.joystick = {
                x: mouse.x,
                y: mouse.y,
                sticky: this.state.joystick.sticky
            }
        } else if (this.state.joystick.sticky) {
            this.state.joystick = {
                x: 50,
                y: 50,
                sticky: this.state.joystick.sticky
            }
        }

        ctx.fillStyle = "green";
        ctx.beginPath();
        ctx.arc(this.state.joystick.x, this.state.joystick.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRotation(ctx, mouse) {
        ctx.fillStyle = "#1a1a1a"
        ctx.fillRect(0,0,100,100);

        ctx.fillStyle = "#767676"
        ctx.beginPath();
        ctx.arc(50, 50, 50, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#1a1a1a"
        ctx.beginPath();
        ctx.arc(50, 50, 40, 0, Math.PI * 2);
        ctx.fill();

        const radius = 45;

        let closestPoint = {x: 0, y: 0, distance: 9999999, angle: new Angle(-1, Angle.Degrees)}
        for (let theta = 0; theta < 360; theta += 1) {
            let point = {
                x: Math.cos(new Angle(theta, Angle.Degrees).get(Angle.Radians)) * radius + 50,
                y: Math.sin(new Angle(theta, Angle.Degrees).get(Angle.Radians)) * radius + 50
            }
            
            let distance = dist(point.x, point.y, mouse.x, mouse.y)

            if (distance < closestPoint.distance) {
                closestPoint = {
                    x: point.x,
                    y: point.y,
                    distance,
                    angle: new Angle(theta, Angle.Degrees)
                }
            }
        }

        if (mouse.down) {
            this.state.rotation.angle = closestPoint.angle;
        }

        let displayPoint = {
            x: Math.cos(this.state.rotation.angle.get(Angle.Radians)) * radius + 50,
            y: Math.sin(this.state.rotation.angle.get(Angle.Radians)) * radius + 50
        }

        ctx.fillStyle = "#40d043"

        ctx.beginPath();
        ctx.arc(displayPoint.x, displayPoint.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFOV(ctx, mouse) {
        ctx.fillStyle = "#1a1a1a"
        ctx.fillRect(0,0,100,100);

        let anglePerSegment = 360 / this.state.fov.segments;

        const radius = 45;

        let closestPoint = {x: 0, y: 0, distance: 9999999, angle: new Angle(-1, Angle.Degrees)}
        for (let s = 0; s < this.state.fov.segments; s++) {
            let point = {
                x: Math.cos(new Angle(anglePerSegment * s, Angle.Degrees).get(Angle.Radians)) * radius + 50,
                y: Math.sin(new Angle(anglePerSegment * s, Angle.Degrees).get(Angle.Radians)) * radius + 50
            }
            
            ctx.fillStyle = "#767676"
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();

            let distance = dist(point.x, point.y, mouse.x, mouse.y)

            if (distance < closestPoint.distance) {
                closestPoint = {
                    x: point.x,
                    y: point.y,
                    distance,
                    angle: new Angle(anglePerSegment * s, Angle.Degrees)
                }
            }
        }

        ctx.beginPath();
        ctx.arc(50, 50, 5, 0, Math.PI * 2);
        ctx.fill();

        let distanceToCenter = dist(50, 50, mouse.x, mouse.y)

        if (distanceToCenter < closestPoint.distance) {
            closestPoint.angle = new Angle(-1, Angle.Degrees)
        }

        if (mouse.down) {
            this.state.fov.degrees = closestPoint.angle;
        }

        ctx.fillStyle = "#40d043"

        if (this.state.fov.degrees.get(Angle.Degrees) === -1) {
            ctx.beginPath();
            ctx.arc(50, 50, 5, 0, Math.PI * 2);
            ctx.fill();
        } else {
            let point = {
                x: Math.cos(this.state.fov.degrees.get(Angle.Radians)) * radius + 50,
                y: Math.sin(this.state.fov.degrees.get(Angle.Radians)) * radius + 50
            }

            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawButton() {

    }

    render() {
        return (
            <div id={`${this.state.id}-parent`} style={{
                position: "absolute",
                top: "300px",
                left: "50px",
                padding: "10px",
                backgroundColor: "#404040",
                color: "white"
            }}>
                <Mover target={`${this.state.id}-parent`}></Mover>
                <p style={{
                    paddingBottom: "3px",
                    fontSize: "10px"
                }}>{this.state.type}</p>
                <Canvas id={`${this.state.id}`}
                    width={"100px"} 
                    height={"100px"} 
                    draw={this.draw.bind(this)}
                ></Canvas>
            </div>
        )
    }
}

export default SimControls;