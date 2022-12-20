import React from "react";
import nt from "../misc/nt";

import "./SpeedCC.css"
import Canvas from "../canvas/Canvas";
import Mover from "../mover/Mover";

import { addTabListener } from "../pynetworktables2js/wrapper"

import { Angle } from "../misc/unit";

const SpeedControllerTabName = "SpeedController";

const maxAmountInList = 1000;

class SpeedCC extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            speedControllers: {},
            selectedController: null,
            doingGraph: false,
            motorImage: null,
            motorImageRotation: 0,
            motorMaxDegreesPerSecond: new Angle(10, Angle.Degrees),
            motorHistory: [],
            motorHistoryInterval: 0
        }

        addTabListener(SpeedControllerTabName, (key, value, isNew) => {
            const splitKey = key.split("/");

            const name = splitKey[0];
            let valueKey = splitKey[1];
            let subGroup = "";
            let isSubgroupValue = false;

            if (name.startsWith(".")) {
                return;
            }

            // if (valueKey.includes("AvgSpeed")) {
            //     console.log(key, value)
            // }
            
            if (splitKey.length > 2) {
                subGroup = splitKey[1];
                valueKey = splitKey[2];
                isSubgroupValue = true;
            }

            if (this.state.speedControllers[name] == undefined) {
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
                if (!!valueKey) {
                    if (valueKey.startsWith("Controller_")) {
                        const controllerNum = valueKey.split("_")[1];
                        this.state.speedControllers[name].speeds[controllerNum] = value;
                    } else {
                        this.state.speedControllers[name][valueKey] = value;
                    }
                }
            }
        })
    }

    getNames() {
        let names = [];
        for (let key in this.state.speedControllers) {
            names = names.concat(this.state.speedControllers[key].getNames())
        }
        return names;
    }

    getControllerByName(name) {
        for (let key of Object.keys(this.state.speedControllers)) {
            if (this.state.speedControllers[key].getNames().includes(name)) {
                if (Object.keys(this.state.speedControllers[key].subGroups).length > 0) {
                    return this.state.speedControllers[key].subGroups[name];
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

            if (this.state.motorHistory.length > 1) {
                const range = this.state.motorHistory[this.state.motorHistory.length - 1].t - this.state.motorHistory[0].t;

                const adjustedList = this.state.motorHistory.map((e, i) => {
                    return {
                        t: e.t - this.state.motorHistory[0].t,
                        s: e.s
                    }
                })
                
                const milliPerPoint = ctx.canvas.width / range; //How many milliseconds per point

                ctx.beginPath();
                ctx.moveTo(0, middle - (adjustedList[0].s * perPoint01))
                for (let i = 1; i < adjustedList.length; i++) {
                    const e = adjustedList[i];
                    ctx.lineTo(e.t * milliPerPoint, middle - (e.s * perPoint01 * 10));
                }
                ctx.stroke();

                let t = 0;

                let per = 1;

                //Per should be equal to 10 when floor(range / 1000) > 20, equal to 100 when floor(range / 1000) > 200, and equal to 1000 when floor(range / 1000) > 2000 and so on and so on
                if (Math.floor(range / 1000) > 10) {
                    per = 10;
                    if (Math.floor(range / 1000) > 100) {
                        per = 100;
                        if (Math.floor(range / 1000) > 1000) {
                            per = 1000; //don't really need to go farther ig.
                        }
                    }
                }

                for (let i = 0; i < Math.floor(range / 1000); i += per) {
                    ctx.strokeStyle = "#c9c9c9";
                    ctx.beginPath();
                    ctx.moveTo(t * milliPerPoint, 0);
                    ctx.lineTo(t * milliPerPoint, ctx.canvas.height);
                    ctx.stroke();

                    ctx.font = `12px Arial`;
                    ctx.fillStyle = "black";
                    ctx.textAlign = "center";
                    ctx.fillText(`${i + 1}`, t * milliPerPoint, middle);

                    t += 1000 * per;
                }

                //If the motorHistory list has a length > maxAmountInList, remove every other element
                //This is to prevent the graph from taking up a crap ton of memory
                //and to stop it crashing people's computers if they forgot to turn it off
                //+ eat up RAM
                //it'll also prob stay consistent tho since 1000 points is a ton of data points so
                //yeah.
                if (this.state.motorHistory.length > maxAmountInList) {
                    this.state.motorHistory = this.state.motorHistory.filter((e, i) => {
                        return i % 2 == 0;
                    })
                }
            }

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
            // console.log(this.getControllerByName.bind(this)(this.state.selectedController).avgSpeed)
            this.state.motorImageRotation += Angle.toRadians(this.state.motorMaxDegreesPerSecond.get(Angle.Degrees) * this.getControllerByName.bind(this)(this.state.selectedController).AvgSpeed);
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

                    const choice = prompt("Enter the name of the controller you want to choose.\n\n" + this.getNames.bind(this)().join(", "));
                    if (choice != null && this.getNames.bind(this)().includes(choice)) {
                        this.setState({selectedController: choice});
                        console.log("[SpeedCC]: monitoring " + choice)
                    } else {
                        this.setState({selectedController: null});
                        console.log("[SpeedCC]: didn't find controller " + choice + " out of ", this.getNames.bind(this)())
                    }
                }
            },
            {
                name: "Tgl Graph",
                onClick: () => {
                    this.state.motorHistory = [];
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
                this.state.motorHistory.push(
                    {
                        s: this.getControllerByName.bind(this)(this.state.selectedController).AvgSpeed,
                        t: new Date().getTime(),
                    }
                )
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