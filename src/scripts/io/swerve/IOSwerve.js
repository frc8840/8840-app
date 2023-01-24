import React from "react";
import Canvas from "../../canvas/Canvas";
import byteops from "../../misc/byteops";
import dist from "../../misc/dist";
import { Angle } from "../../misc/unit";
import Mover from "../../mover/Mover";
import { addTabListener } from "../../pynetworktables2js/wrapper";

import './IOSwerve.css'

const keyStart = "Swerve Module";

class IOSwerveModule extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            info: {
                "-1": {
                    
                }
            },
            monitor: "-1",
            lastMouseState: false,
            loadRot: 0,
            t: 0,
            velocityHistory: [],
            isDoingPlot: true,
            pausePlot: false,
        }

        addTabListener("IO", (key, value, isNew) => {
            if (key.startsWith(keyStart)) {
                //EX: [keyStart]/absolute position/0/value = value

                const ioValueKey = key.split("/")[1];
                const index = parseInt(key.split("/")[0].replace(keyStart + " ", ""));
                const isValue = key.split("/")[3] == "value";
                const isRealInfo = key.split("/")[3] == "real";
                const isPermissions = key.split("/")[3] == "p";

                if (!isValue && !isRealInfo && !isPermissions) return;

                if (ioValueKey == "DriveData") {
                    if (isValue) {
                        const data = this.parseDriveDataByteArray(value);

                        if (index == this.state.monitor) {
                            this.state.velocityHistory.push({
                                t: Date.now(),
                                v: data.rawDriveVelocity * data.driveVelocityConversionFactor,
                            })
                        }

                        this.state.info[index] = {
                            ...this.state.info[index],
                            ...data,
                        }
                    } else if (isRealInfo) {
                        this.state.info[index] = {
                            ...this.state.info[index],
                            isReal: (value == "true" || value == true),
                        }
                    } else if (isPermissions) {
                        let perms = [];
                        if (value.includes("r")) perms.push("READ");
                        if (value.includes("w")) perms.push("WRITE");
                        
                        this.state.info[index] = {
                            ...this.state.info[index],
                            permissions: perms,
                        }
                    }
                }
            }
        });
    }

    parseDriveDataByteArray(arr) {
        //ARR IS a string, seperated by commas
        arr = arr.split(",").map((x) => parseFloat(x));

        const type = arr[0] == 0 ? "Spark Max" : "Falcon 500";
        const id = arr[1];
        const rawDrivePosition = arr[2];
        const rawDriveVelocity = arr[3];
        const driveConversionFactor = arr[4];
        const driveVelocityConversionFactor = arr[5];
        const rawTurnPosition = arr[6];
        const turnConversionFactor = arr[7];
        const absolutePosition = arr[8];
        const velocity = arr[9];
        const angle = arr[10];

        return {
            type,
            id,
            rawDrivePosition,
            rawDriveVelocity,
            driveConversionFactor,
            driveVelocityConversionFactor,
            rawTurnPosition,
            turnConversionFactor,
            absolutePosition,
            velocity,
            angle,
        }
    }

    draw(ctx, frameCount, rel, canvas, mouse) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const info = this.state.info[this.state.monitor];

        if (info == null || Object.keys(info) == 0) {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = "white";
            ctx.font = "12px Arial";
            //make bold
            ctx.font = "bold " + ctx.font;
            ctx.textAlign = "center";
            ctx.fillText("Waiting for swerve module...", canvas.width / 2, canvas.height / 2 - 50);

            ctx.strokeStyle = "white";
            ctx.lineWidth = 10;
            ctx.beginPath()
            ctx.arc(canvas.width / 2, canvas.height / 2 + 20, 30, 0 + this.state.loadRot, 2 * Math.PI - 1/3 * Math.PI + this.state.loadRot);
            ctx.stroke();

            this.state.t += 1;

            //increase loadrot based on the sin of t
            this.state.loadRot += Math.abs(Math.sin(this.state.t / 19) / 10) + 0.04;

            return;
        }

        const { velocity, angle } = info;

        //console.log(velocity, angle)

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (!this.state.isDoingPlot) {
            //Draw an arrow in the direction of angle with a length of velocity / 5 * 100
            const arrowLength = velocity / 5 * 100;

            ctx.strokeStyle = "white";
            ctx.lineWidth = 10;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, canvas.height / 2);
            
            const arrowX = canvas.width / 2 + arrowLength * Math.cos(Angle.toRadians(angle));
            const arrowY = canvas.height / 2 + arrowLength * Math.sin(Angle.toRadians(angle));

            ctx.lineTo(arrowX, arrowY);
            ctx.stroke();
        } else if (this.state.velocityHistory.length > 0) {
            const middle = (ctx.canvas.height - 30) / 2;
            const perPoint01 = middle / 12;

            const range = this.state.velocityHistory[this.state.velocityHistory.length - 1].t - this.state.velocityHistory[0].t;

            const maxHeight = 100;

            ctx.strokeStyle = "gray";
            ctx.lineWidth = 1;
            ctx.moveTo(0, middle);
            ctx.lineTo(ctx.canvas.width, middle);
            ctx.stroke();

            ctx.strokeStyle = "white";
            ctx.lineWidth = 1;

            const adjustedList = this.state.velocityHistory.map(e => {
                return {
                    t: e.t - this.state.velocityHistory[0].t,
                    v: e.v,
                }
            });

            const milliPerPoint = ctx.canvas.width / range;

            ctx.beginPath();
            ctx.moveTo(0, middle - (adjustedList[0].v * perPoint01 * 10));
            for (let i = 1; i < adjustedList.length; i++) {
                const point = adjustedList[i];
                ctx.lineTo(point.t * milliPerPoint, middle - (point.v * perPoint01 * 10));
            }
            ctx.stroke();

            if (!this.state.pausePlot) {
                this.state.velocityHistory = this.state.velocityHistory.filter((e) => {
                    return this.state.velocityHistory[this.state.velocityHistory.length - 1].t - e.t < 5000;
                })
            }
        }


        document.getElementById("mod_raw_drive_pos").innerHTML = info.rawDrivePosition;
        document.getElementById("mod_raw_turn_pos").innerHTML = info.rawTurnPosition;
        document.getElementById("mod_drive_pos").innerHTML = info.rawDrivePosition * info.driveConversionFactor;
        document.getElementById("mod_turn_pos").innerHTML = info.rawTurnPosition * info.turnConversionFactor;
        document.getElementById("mod_velo").innerHTML = info.velocity;
        document.getElementById("mod_angle").innerHTML = info.angle;

        this.state.lastMouseState = mouse.down;
    }

    switchTo() {
        const keys = Object.keys(this.state.info);
        //remove -1
        keys.splice(keys.indexOf("-1"), 1);

        if (keys.length == 0) {
            alert("No Swerve Drive Modules to monitor! Please connect a Swerve Drive Module to the robot and register it though 8840utils.");
            return;
        }

        const newMonitor = prompt(`Enter Swerve Drive Module index to monitor: ${keys.join(", ")}`, this.state.monitor);

        if (newMonitor == null) return;

        if (keys.includes(newMonitor)) {
            this.state.monitor = newMonitor;
        } else {
            alert(`Invalid index! Must be one of ${keys.join(", ")}`);
        }
    }

    componentDidMount() {
        
    }

    render() {
        return (
            <div id="io-swervemod-parent">
                <Mover target="io-swervemod-parent"></Mover>
                <Canvas id="io-swervemod" 
                    width={"200px"} 
                    height={"200px"} 
                    draw={this.draw.bind(this)}
                ></Canvas>
                <p>Raw Drive Position: <span id="mod_raw_drive_pos">0</span></p>
                <p>Drive Position: <span id="mod_drive_pos">0</span></p>
                <p>Raw Turn Position: <span id="mod_raw_turn_pos">0</span></p>
                <p>Turn Position: <span id="mod_turn_pos">0</span></p>
                <p>Velocity: <span id="mod_velo">0</span></p>
                <p>Angle: <span id="mod_angle">0</span></p>
                <button onClick={this.switchTo.bind(this)}>Switch To</button>
            </div>
        )
    }
}

export default IOSwerveModule;