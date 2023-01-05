import React from 'react';

import "./SwerveInfo.css";

import Mover from '../mover/Mover';
import Canvas from '../canvas/Canvas';

import { addTabListener } from "../pynetworktables2js/wrapper"
import { Angle } from '../misc/unit';

class SwerveInfo extends React.Component {
    constructor(props) {
        super(props);

        let newMods = [];
        for (let i = 0; i < 4; i++) newMods.push({
            rotation: 0,
            speed: 0,
            velocity_ms: 0,
            last_angle: 0,
        });

        this.state = {
            swerveName: "swerve",
            modules: newMods,
            pose: {
                x: 0,
                y: 0,
                angle: 0
            }
        }

        addTabListener("swerve_drive", (key, value, isNew) => {
            //Check if it's not a module, rather a name.
            const splitKey = key.split("_");
            if (splitKey[0] != "module") {
                if (key == "name") {
                    this.setState({
                        swerveName: value
                    })
                } else if (key.startsWith("pose")) {
                    const poseKey = key.split("/")[1];
                    this.state.pose[poseKey] = parseFloat(value);
                }
                return;
            }

            //Get info
            const modNum = splitKey[1].split("/")[0];

            //Used for replacing
            const initialBit = splitKey[0] + "_" + splitKey[1] + "/";
            
            //Get the module data key
            const variable = key.split("/")[1].replace(initialBit, "")

            if (variable == "rotation") {
                value = value % 360;
                if (value < 0) {
                    value += 360;
                }
            }

            //Set state
            this.state.modules[modNum][variable] = value;
        })
    }
    draw(ctx) {
        // ctx.fillStyle = "white";
        // ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // ctx.fillStyle = "black";

        // ctx.font = "13px Arial";
        // ctx.fillText("Swerve - \"" + this.state.swerveName + "\"", 10, 20);
        
        // for (let i = 0; i < this.state.modules.length; i++) {
        //     const mod = this.state.modules[i];
        //     ctx.fillText(
        //         (i + 1) + ": " + (Math.floor(mod.rotation * 100) / 100) + "°, (last: " + (Math.floor(mod.last_angle * 100) / 100) + "°), " + (Math.floor(mod.velocity_ms * 100) / 100) + "m/s, " + (Math.floor(mod.speed * 100) + "%"), 
        //         10, 40 + (i * 20)
        //     );
        // }

        ctx.clearRect(0,0,300,300)

        ctx.fillStyle = "#121212";
        ctx.fillRect(0, 0, 300, 300);

        const robotSide = 130;
        const moduleCircleRadius = 10;

        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate(new Angle(360 - this.state.pose.angle + 90, Angle.Degrees).get(Angle.Radians));
        
        ctx.beginPath();

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#e8e8e8";
        ctx.moveTo((-robotSide / 2), (robotSide / 2) - moduleCircleRadius)
        ctx.lineTo((-robotSide / 2), (-robotSide / 2) + moduleCircleRadius)

        ctx.moveTo((robotSide / 2), (robotSide / 2) - moduleCircleRadius)
        ctx.lineTo((robotSide / 2), (-robotSide / 2) + moduleCircleRadius)

        ctx.moveTo((-robotSide / 2) + moduleCircleRadius, (-robotSide / 2))
        ctx.lineTo((robotSide / 2) - moduleCircleRadius, (-robotSide / 2))

        ctx.moveTo((-robotSide / 2) + moduleCircleRadius, (robotSide / 2))
        ctx.lineTo((robotSide / 2) - moduleCircleRadius, (robotSide / 2))
        
        ctx.stroke();


        ctx.beginPath();
        ctx.arc((-robotSide / 2), (-robotSide / 2), moduleCircleRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc((robotSide / 2), (-robotSide / 2), moduleCircleRadius, 0, Math.PI * 2)
        ctx.stroke();

        ctx.beginPath();
        ctx.arc((-robotSide / 2), (robotSide / 2), moduleCircleRadius, 0, Math.PI * 2)
        ctx.stroke();

        ctx.beginPath();
        ctx.arc((robotSide / 2), (robotSide / 2), moduleCircleRadius, 0, Math.PI * 2)        
        ctx.stroke();

        ctx.fillStyle = "#e8e8e8"

        //Draw circle at front  
        ctx.beginPath();
        ctx.arc(0, -robotSide / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        const positions = [
            { //Top left
                x: -robotSide / 2,
                y: -robotSide / 2,
                color: "red"
            },
            { //Top right
                x: robotSide / 2,
                y: -robotSide / 2,
                color: "blue"
            },
            { //Back left
                x: -robotSide / 2,
                y: robotSide / 2,
                color: "green"
            },
            { //Back right
                x: robotSide / 2,
                y: robotSide / 2,
                color: "yellow"
            }
        ]

        const maxVelocity = 5;
        const pixelsForMax = 50;

        for (let i = 0; i < 4; i++) {
            //First module is front left
            let rotation = new Angle(360 - this.state.modules[i].rotation + 270, Angle.Degrees);
            let velocity = this.state.modules[i].velocity_ms;

            if (velocity < 0) {
                rotation.add(new Angle(180, Angle.Degrees));
                velocity = Math.abs(velocity);
            }

            if (velocity < 0.1) continue;

            const angleDiff = Math.PI / 7;
            const percentage = 0.9;

            ctx.strokeStyle = positions[i].color;
            ctx.lineWidth = 4;

            ctx.beginPath();
            ctx.moveTo(positions[i].x, positions[i].y);
            ctx.lineTo(
                (Math.cos(rotation.get(Angle.Radians)) * (velocity / maxVelocity) * pixelsForMax) + positions[i].x,
                (Math.sin(rotation.get(Angle.Radians)) * (velocity / maxVelocity) * pixelsForMax) + positions[i].y
            );
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(
                (Math.cos(rotation.get(Angle.Radians)) * (velocity / maxVelocity) * pixelsForMax) + positions[i].x,
                (Math.sin(rotation.get(Angle.Radians)) * (velocity / maxVelocity) * pixelsForMax) + positions[i].y
            );
            ctx.lineTo(
                (Math.cos((rotation.get(Angle.Radians)) - angleDiff) * (velocity / maxVelocity) * percentage * pixelsForMax) + positions[i].x,
                (Math.sin((rotation.get(Angle.Radians)) - angleDiff) * (velocity / maxVelocity) * percentage * pixelsForMax) + positions[i].y
            );
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(
                (Math.cos(rotation.get(Angle.Radians)) * (velocity / maxVelocity) * pixelsForMax) + positions[i].x,
                (Math.sin(rotation.get(Angle.Radians)) * (velocity / maxVelocity) * pixelsForMax) + positions[i].y
            );
            ctx.lineTo(
                (Math.cos(rotation.get(Angle.Radians) + angleDiff) * (velocity / maxVelocity) * percentage * pixelsForMax) + positions[i].x,
                (Math.sin(rotation.get(Angle.Radians) + angleDiff) * (velocity / maxVelocity) * percentage * pixelsForMax) + positions[i].y
            );
            ctx.stroke();
        }

        ctx.restore();
    }
    render() {
        return (
            <div id="swerve-info-parent">
                <Mover target="swerve-info-parent"></Mover>
                <Canvas id="swerve-info" 
                    width={"300px"} 
                    height={"300px"} 
                    draw={this.draw.bind(this)}
                ></Canvas>
            </div>
        )
    }
}

export default SwerveInfo;