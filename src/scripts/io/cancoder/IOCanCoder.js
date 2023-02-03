import React from "react";
import Canvas from "../../canvas/Canvas";
import dist from "../../misc/dist";
import { Angle } from "../../misc/unit";
import Mover from "../../mover/Mover";
import { addTabListener } from "../../pynetworktables2js/wrapper";

import './IOCanCoder.css'

const keyStart = "CANCoder";

class IOCanCoder extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            info: {
                "-1": {
                    absolutePosition: 0,
                    isReal: false,
                }
            },
            monitor: "-1",
            lastMouseState: false,
        }

        addTabListener("IO", (key, value, isNew) => {
            if (key.startsWith(keyStart)) {
                //EX: [keyStart]/0/absolute_position/value = value

                //EX: [keyStart]/0/.info/real = true or false
                //EX: [keyStart]/.info/p = true or false

                const splitKey = key.split("/");
                const gsk = (i) => {
                    if (splitKey.length <= i) return "";
                    return splitKey[i];
                } 

                const index = parseInt(gsk(1));
                const ioValueKey = gsk(2);
                const isValue = gsk(3) == "v";

                const isRealInfo = gsk(2) == ".info" && gsk(3) == "real";
                const isPermissions = gsk(2) == "p";

                if (!isValue && !isRealInfo && !isPermissions) return;

                if (ioValueKey == "absolute position") {
                    if (isValue) {
                        this.state.info[index] = {
                            ...this.state.info[index],
                            absolutePosition: parseFloat(value),
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

    draw(ctx, frameCount, rel, canvas, mouse) {
        ctx.clearRect(0, 0, 300, 300);
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 300, 300);

        ctx.fillStyle = "black";
        ctx.font = "18px Arial";
        ctx.fillText(`CANCoder ${this.state.monitor == "-1" ? "?" : this.state.monitor}`, 10, 30);

        const r = 100;
        
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(150, 150, r, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "18px Arial";
        ctx.fillText("0°", 145, 46);

        ctx.fillStyle = "black";
        ctx.font = "18px Arial";
        ctx.fillText("90°", 262, 155);

        ctx.fillStyle = "black";
        ctx.font = "18px Arial";
        ctx.fillText("270°", 5, 155);

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(150, 150);
        const deg = Angle.toRadians(this.state.info[this.state.monitor].absolutePosition) - Math.PI / 2;
        ctx.lineTo(Math.cos(deg) * r + 150, Math.sin(deg) * r + 150);
        ctx.stroke();

        ctx.fillStyle = "black";
        ctx.font = "16px Arial";

        const precision = 10000;

        ctx.fillText(`Real: ${this.state.info[this.state.monitor].isReal ? "Yes" : "No"}, Degrees: ${Math.round(this.state.info[this.state.monitor].absolutePosition * precision) / precision}°`, 10, 280);
        
        document.getElementById("copiable-cancoder-degree").innerText = this.state.info[this.state.monitor].absolutePosition;

        
        this.state.lastMouseState = mouse.down;
    }

    switchTo() {
        const keys = Object.keys(this.state.info);
        //remove -1
        keys.splice(keys.indexOf("-1"), 1);

        if (keys.length == 0) {
            alert("No CANCoder devices found! Please use IOCANCoder to add one, or create your own IOCANCoder class with base name of \"CANCoder\".");
            return;
        }

        const newMonitor = prompt(`Enter IOCANCoder index to monitor: ${keys.join(", ")}`, this.state.monitor);

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
            <div id="io-cancoder-parent">
                <Mover target="io-cancoder-parent"></Mover>
                <Canvas id="io-cancoder" 
                    width={"300px"} 
                    height={"300px"} 
                    draw={this.draw.bind(this)}
                ></Canvas>
                <p style={{ color: "white", fontSize: "15px"}}>Copiable Value: <span id="copiable-cancoder-degree">0</span></p>
                <button onClick={this.switchTo.bind(this)}>Switch To</button>
            </div>
        )
    }
}

export default IOCanCoder;