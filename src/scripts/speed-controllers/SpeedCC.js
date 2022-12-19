import React from "react";
import nt from "../misc/nt";

import "./SpeedCC.css"
import Canvas from "../canvas/Canvas";
import Mover from "../mover/Mover";

import { addTabListener } from "../pynetworktables2js/wrapper"

import { Angle } from "../misc/unit";

const SpeedControllerTabName = "SpeedControllers";

class SpeedCC extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            speedControllers: {},
            selectedController: null,
            doingGraph: false,
            motorImage: null,
            motorImageRotation: 0,
            motorMaxDegreesPerSecond: new Angle(270, Angle.Degrees),
            motorHistory: [],
            motorHistoryInterval: 0
        }

        addTabListener(SpeedControllerTabName, (key, value, isNew) => {
            const splitKey = key.split("/");

            const name = splitKey[0];
            let valueKey = splitKey[1];
            let subGroup = "";
            let isSubgroupValue = false;
            
            if (splitKey.length > 2) {
                subGroup = splitKey[1];
                valueKey = splitKey[2];
                isSubgroupValue = true;
            }

            if (this.speedControllers[name] == undefined) {
                this.state.speedControllers[name] = {
                    hasSubGroups: false,
                    subGroups: {},
                    speeds: {},
                    avgSpeed: 0,
                    name,
                    getNames() {
                        let names = [this.name];
                        if (this.subGroups.length > 0 || this.hasSubGroups) {
                            for (let key in this.subGroups) {
                                names.push(this.subGroups[key].name);
                            }
                        }
                        return names;
                    }
                };
            }

            if (isSubgroupValue) {
                if (!Object.keys(this.speedControllers[name].subGroup).includes(subGroup)) {
                    this.state.speedControllers[name].subGroup[subGroup] = {
                        speeds: {},
                        avgSpeed: 0,
                    }
                }
                if (valueKey.startsWith("Controller_")) {
                    const controllerNum = valueKey.split("_")[1];
                    this.state.speedControllers[name].subGroup[subGroup].speeds[controllerNum] = value;
                } else {
                    this.state.speedControllers[name].subGroups[subGroup][valueKey] = value;
                }
            } else {
                if (valueKey.startsWith("Controller_")) {
                    const controllerNum = valueKey.split("_")[1];
                    this.state.speedControllers[name].speeds[controllerNum] = value;
                } else {
                    this.state.speedControllers[name][valueKey] = value;
                }
            }
        })
    }

    getNames() {
        let names = [];
        for (let key in this.state.speedControllers) {
            names.push(this.state.speedControllers[key].getNames());
        }
        return names;
    }

    getControllerByName(name) {
        for (let key in Object.keys(this.state.speedControllers)) {
            if (this.state.speedControllers[key].getNames().includes(name)) {
                if (Object.keys(this.state.speedControllers[key].subGroup).length > 0) {
                    return this.state.speedControllers[key].subGroup[name];
                } else {
                    return this.state.speedControllers[key];
                }
            }
        }
        return null;
    }

    draw(ctx, frameCount, rel, canvas, mouse) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (this.state.doingGraph) {
            const middle = (ctx.canvas.height - 30) / 2;

            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.moveTo(0, middle);
            ctx.lineTo(ctx.canvas.width, middle);
            ctx.stroke();

            const perPoint01 = middle / 12;


            for (let i = -13; i < 13; i++) {
                ctx.strokeStyle = "#c9c9c9";
                ctx.beginPath();
                ctx.moveTo(0, middle + (i * perPoint01));
                ctx.lineTo(ctx.canvas.width, middle + (i * perPoint01));
                ctx.stroke();

                if (Math.abs(i) % 5 == 0) {
                    ctx.font = `12px Arial`;
                    ctx.fillStyle = "black";
                    ctx.textAlign = "left";
                    ctx.fillText(`${i / -10}`, 5, middle + (i * perPoint01) + 5);
                }
            }

            ctx.strokeStyle = "black";
        } else {
            //Draw image of motor
            if (this.state.motorImage != null) {
                const iheight = 100;
                const iwidth = 100;

                ctx.save();
                //Rotate image
                ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
                ctx.rotate(this.state.motorImageRotation);
                ctx.drawImage(this.state.motorImage, -(iwidth / 2), -(iheight / 2), iwidth, iheight);
                ctx.restore();
            }
        }

        if (this.state.selectedController != null) {
            this.state.motorImageRotation += this.state.motorMaxDegreesPerSecond.get(Angle.Radians) * this.getControllerByName.bind(this)(this.state.selectedController).avgSpeed;
        }

        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";
        ctx.font = `12px Arial`;
        ctx.textAlign = "left";

        ctx.fillText(`Current Contlr: ${this.state.selectedController == null ? "None Selected" : this.state.selectedController}`, 20, 20);

        this.drawMenu(ctx, frameCount, rel, canvas, mouse);
    }

    drawMenu(ctx, frameCount, rel, canvas, mouse) {
        //Draw menu at bottom
        ctx.beginPath();
        ctx.moveTo(0, ctx.canvas.height - 30);
        ctx.lineTo(ctx.canvas.width, ctx.canvas.height - 30);
        ctx.stroke();

        const menuOptions = [
            {
                name: "Choose Contlr",
                onClick: () => {
                    mouse.cancelMouseDown();

                    const choice = prompt("Enter the name of the controller you want to choose.\n\n" + this.getNames().join(", "));
                    if (choice != null && this.getNames.bind(this)().includes(choice)) {
                        this.setState({selectedController: choice});
                    } else {
                        this.setState({selectedController: null});
                    }
                }
            },
            {
                name: "Tgl Graph",
                onClick: () => {
                    mouse.cancelMouseDown();
                    this.setState({doingGraph: !this.state.doingGraph});
                }
            },
            {
                name: "Clear",
                onClick: () => {
                    this.setState({selectedController: null});
                }
            }
        ];

        const spacePerMenuItem = ctx.canvas.width / menuOptions.length;
        const spaceBetween = 1
        for (let i = 0; i < menuOptions.length; i++) {
            const option = menuOptions[i];
            ctx.fillStyle = "#a8a8a8";

            if (mouse.x > i * spacePerMenuItem && mouse.x < (i + 1) * spacePerMenuItem && mouse.y > ctx.canvas.height - 30) {
                ctx.fillStyle = "#e8e8e8";
                if (mouse.down) {
                    option.onClick();
                }
            }

            ctx.fillRect(i * spacePerMenuItem + (i == 0 ? 0 : spaceBetween / 2), ctx.canvas.height - 29, spacePerMenuItem - ( i == menuOptions.length - 1 ? (i == 0 ? 0 : spaceBetween / 2) : spaceBetween), 30);

            ctx.fillStyle = "black";
            ctx.font = `${10 + (10 / menuOptions.length)}px Arial`;
            ctx.textAlign = "center";
            ctx.fillText(option.name, spacePerMenuItem * (i + 0.5), ctx.canvas.height - 10);
        }
    }
    
    componentDidMount() {
        //Load images/Motor.png
        this.state.motorImage = new Image();
        this.state.motorImage.src = "images/Motor.png";

        this.state.motorHistoryInterval = setInterval(() => {
            if (this.state.selectedController != null) {
                this.state.motorHistory.push(this.getControllerByName.bind(this)(this.state.selectedController).avgSpeed)
            }
        }, 50);
    }

    componentWillUnmount() {
        clearInterval(this.state.motorHistoryInterval)
    }

    render() {
        return (
            <div id="cc-parent">
                <Mover target="cc-parent"></Mover>
                <Canvas id="cc" 
                    width={400} 
                    height={300} 
                    draw={this.draw.bind(this)}
                ></Canvas>
            </div>
        )
    }
}

export default SpeedCC;