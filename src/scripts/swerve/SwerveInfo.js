import React from 'react';

import "./SwerveInfo.css";

import Mover from '../mover/Mover';
import Canvas from '../canvas/Canvas';

import { addTabListener } from "../pynetworktables2js/wrapper"
import { Angle, Unit } from '../misc/unit';

class SwerveInfo extends React.Component {
    static width = new Unit(25, Unit.Type.INCHES);
    static length = new Unit(25, Unit.Type.INCHES);
    static maxVelocity = 10; //m/s

    static {
        if (window.localStorage.getItem("robot-size") != null) {
            const size = JSON.parse(window.localStorage.getItem("robot-size"));

            SwerveInfo.width = new Unit(size.width, Unit.Type.INCHES);
            SwerveInfo.length = new Unit(size.length, Unit.Type.INCHES);
        }

        if (window.localStorage.getItem("swerve-settings") != null) {
            const settings = JSON.parse(window.localStorage.getItem("swerve-settings"));

            SwerveInfo.maxVelocity = settings.maxVelocity;
        }
    }
    
    constructor(props) {
        super(props);

        let newMods = [];
        for (let i = 0; i < 4; i++) newMods.push({
            rotation: 0,
            speed: 0,
            velocity_ms: 0,
            last_angle: 0,
        });

        let newDesiredMods = [];
        for (let i = 0; i < 4; i++) newDesiredMods.push({
            rotation: 0,
            speed: 0,
        });

        let isLog = Object.keys(props).includes("log") ? props.log : false;

        this.state = {
            swerveName: "swerve",
            modules: newMods,
            desired_modules: newDesiredMods,
            pose: {
                x: 0,
                y: 0,
                angle: 0
            },
            showRealState: true,
            showDesiredState: true,
            throughLog: isLog,
        }

        if (this.state.throughLog) {
            addTabListener("desired_swerve_drive", (key, value, isNew) => {
                //Get info
                const modNum = key.split("/")[0];
                
                //Get the module data key
                const variable = key.split("/")[1];

                if (variable == "rotation") {
                    value = value % 360;
                    if (value < 0) {
                        value += 360;
                    }
                }

                //Set state
                this.state.desired_modules[modNum][variable] = value;
            })

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

        this.toggleDesiredState = this.toggleDesiredState.bind(this);
        this.toggleRealState = this.toggleRealState.bind(this);
    }
    toggleDesiredState() {
        this.setState({
            showDesiredState: !this.state.showDesiredState
        });
    }
    toggleRealState() {
        this.setState({
            showRealState: !this.state.showRealState
        });
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

        const robotLength = SwerveInfo.length.getcu(4, Unit.Type.INCHES);
        const robotWidth = SwerveInfo.width.getcu(4, Unit.Type.INCHES);
        const moduleCircleRadius = 10;

        ctx.save();
        ctx.translate(150, 150);
        ctx.rotate(new Angle(360 - this.state.pose.angle + 90, Angle.Degrees).get(Angle.Radians));
        
        ctx.beginPath();

        ctx.lineWidth = 4;
        ctx.strokeStyle = "#e8e8e8";
        ctx.moveTo((-robotWidth / 2), (robotLength / 2) - moduleCircleRadius)
        ctx.lineTo((-robotWidth / 2), (-robotLength / 2) + moduleCircleRadius)

        ctx.moveTo((robotWidth / 2), (robotLength / 2) - moduleCircleRadius)
        ctx.lineTo((robotWidth / 2), (-robotLength / 2) + moduleCircleRadius)

        ctx.moveTo((-robotWidth / 2) + moduleCircleRadius, (-robotLength / 2))
        ctx.lineTo((robotWidth / 2) - moduleCircleRadius, (-robotLength / 2))

        ctx.moveTo((-robotWidth / 2) + moduleCircleRadius, (robotLength / 2))
        ctx.lineTo((robotWidth / 2) - moduleCircleRadius, (robotLength / 2))
        
        ctx.stroke();


        ctx.beginPath();
        ctx.arc((-robotWidth / 2), (-robotLength / 2), moduleCircleRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc((robotWidth / 2), (-robotLength / 2), moduleCircleRadius, 0, Math.PI * 2)
        ctx.stroke();

        ctx.beginPath();
        ctx.arc((-robotWidth / 2), (robotLength / 2), moduleCircleRadius, 0, Math.PI * 2)
        ctx.stroke();

        ctx.beginPath();
        ctx.arc((robotWidth / 2), (robotLength / 2), moduleCircleRadius, 0, Math.PI * 2)        
        ctx.stroke();

        ctx.fillStyle = "#e8e8e8"

        //Draw circle at front  
        ctx.beginPath();
        ctx.arc(0, -robotLength / 2, 8, 0, Math.PI * 2);
        ctx.fill();

        const positions = [
            { //Top right
                x: robotWidth / 2,
                y: robotLength / 2,
                color: "red"
            },
            { //bottom right
                x: robotWidth / 2,
                y: -robotLength / 2,
                color: "pink"
            },
            { //top left
                x: -robotWidth / 2,
                y: robotLength / 2,
                color: "green"
            },
            { //Back left
                x: -robotWidth / 2,
                y: -robotLength / 2,
                color: "yellow"
            }
        ]

        //switch y to canvas coords
        for (let i = 0; i < positions.length; i++) {
            positions[i].y *= -1;
        }

        if (this.state.throughLog) {
            const currentData = window.loga.getDataNow();

            const rotationsExist = currentData && currentData["Swerve Drive Module Angles"];
            const speedsExist = currentData && currentData["Swerve Drive Module Speeds"];

            if (rotationsExist && speedsExist) {
                const rotations = currentData["Swerve Drive Module Angles"].value;
                const speeds = currentData["Swerve Drive Module Speeds"].value;

                for (let i = 0; i < 4; i++) {
                    //Set rotation
                    this.state.modules[i].rotation = rotations[i];
                    this.state.modules[i].speed = speeds[i];
                }

                this.state.showRealState = true;
            } else {
                this.state.showRealState = false;
            }

            const desiredRotationsExist = currentData && currentData["Desired Swerve Drive Module Angles"];
            const desiredSpeedsExist = currentData && currentData["Desired Swerve Drive Module Speeds"];

            if (desiredRotationsExist && desiredSpeedsExist) {
                const desiredRotations = currentData["Desired Swerve Drive Module Angles"].value;
                const desiredSpeeds = currentData["Desired Swerve Drive Module Speeds"].value;

                for (let i = 0; i < 4; i++) {
                    //Set rotation
                    this.state.desired_modules[i].rotation = desiredRotations[i];
                    this.state.desired_modules[i].speed = desiredSpeeds[i];
                }

                this.state.showDesiredState = true;
            } else {
                this.state.showDesiredState = false;
            }
        }

        const maxVelocity = SwerveInfo.maxVelocity;
        const pixelsForMax = 50;

        if (this.state.showDesiredState) {
            //Draw desired state
            for (let i = 0; i < 4; i++) {
                //First module is front left
                let rotation = new Angle(360 - this.state.desired_modules[i].rotation + 270, Angle.Degrees);
                let velocity = this.state.desired_modules[i].speed;

                // if (velocity < 0) {
                //     rotation.add(new Angle(180, Angle.Degrees));
                //     velocity = Math.abs(velocity);
                // }

                if (Math.abs(velocity) < 0.05) continue;

                const angleDiff = Math.PI / 7;
                const percentage = 0.9;

                ctx.strokeStyle = "blue";
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
        }


        if (this.state.showRealState) {
            //Draw Set Velocity
            for (let i = 0; i < 4; i++) {
                //First module is front left
                let rotation = new Angle(360 - this.state.modules[i].rotation + 270, Angle.Degrees);
                let velocity = this.state.modules[i].velocity_ms;

                if (velocity < 0) {
                    rotation.add(new Angle(180, Angle.Degrees));
                    velocity = Math.abs(velocity);
                }

                if (velocity < 0.05) continue;

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
                <br/>
                {
                this.state.throughLog ? null : 
                <>
                    <button onClick={this.toggleDesiredState}>Toggle Desired States</button>
                    <button onClick={this.toggleRealState}>Toggle Real States</button> 
                </>
                }
            </div>
        )
    }
}

export default SwerveInfo;