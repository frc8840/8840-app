import React from "react";
import Canvas from "../../canvas/Canvas";
import dist from "../../misc/dist";
import Mover from "../../mover/Mover";
import { addTabListener } from "../../pynetworktables2js/wrapper";

import './IOPD.css'

const pdhPositions = JSON.parse('[{"x":333,"y":330},{"x":333,"y":303},{"x":333,"y":280},{"x":333,"y":254},{"x":334,"y":226},{"x":332,"y":195},{"x":333,"y":167},{"x":335,"y":142},{"x":334,"y":116},{"x":334,"y":90},{"x":166,"y":89},{"x":166,"y":116},{"x":166,"y":143},{"x":167,"y":169},{"x":167,"y":192},{"x":167,"y":226},{"x":168,"y":251},{"x":167,"y":276},{"x":166,"y":303},{"x":167,"y":328}]');
const pdpPositions = JSON.parse('[{"x":138,"y":93},{"x":139,"y":136},{"x":137,"y":180},{"x":139,"y":220},{"x":142,"y":259},{"x":140,"y":289},{"x":143,"y":315},{"x":142,"y":343},{"x":352,"y":345},{"x":352,"y":316},{"x":352,"y":290},{"x":352,"y":259},{"x":352,"y":221},{"x":354,"y":177},{"x":356,"y":136},{"x":354,"y":93}]');

const keyStart = "Power_Distribution";

class IOPowerDistribution extends React.Component {
    static Type = {
        PDP: "PDP",
        PDH: "PDH"
    }
    constructor(props) {
        super(props);

        this.state = {
            pdpImage: null,
            pdhImage: null,
            pdpImageSizingMultiplier: 0.6,
            pdhImageSizingMultiplier: 0.6,
            currentlyDrawing: IOPowerDistribution.Type.PDP,
            loadedPDP: false,
            loadedPDH: false,

            lastMouseState: false,
            
            ioCurrents: [],
            channels: 0,
            temperature: 0,
            voltage: 0,
        }

        addTabListener("IO", (key, value, isNew) => {
            if (key.startsWith(keyStart)) {
                //EX: keyStart/name/0/xyz = value

                const relKey = key.split("/")[1];
                const isValue = key.split("/")[3] == "value";

                if (!isValue) return;

                if (relKey == "current") {
                    this.state.ioCurrents = value;
                } else if (relKey == "number of channels") {
                    this.state.channels = parseInt(value);
                } else if (relKey == "tempature") {
                    this.state.temperature = parseFloat(value);
                }
            }
        });
    }

    draw(ctx, frameCount, rel, canvas, mouse) {
        ctx.clearRect(0, 0, 500, 500);
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 500, 500);

        const image = this.state.currentlyDrawing == IOPowerDistribution.Type.PDP ? this.state.pdpImage : this.state.pdhImage;

        let iwidth = image != null ? image.width : 500;
        let iheight = image != null ? image.height : 500;

        iwidth *= this.state[this.state.currentlyDrawing.toLowerCase() + "ImageSizingMultiplier"];
        iheight *= this.state[this.state.currentlyDrawing.toLowerCase() + "ImageSizingMultiplier"];

        if (this.state.loadedPDH && this.state.loadedPDP && image != null) {
            ctx.save();
            ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
            ctx.drawImage(image, -(iwidth / 2), -(iheight / 2), iwidth, iheight);
            ctx.restore();
        }

        ctx.fillStyle = "black";

        const positions = this.state.currentlyDrawing == IOPowerDistribution.Type.PDP ? pdpPositions : pdhPositions;

        let closestIndex = -1;
        let closestDistance = Infinity;

        for (let i = 0; i < positions.length; i++) {
            if (dist(mouse.x, mouse.y, positions[i].x, positions[i].y) < closestDistance) {
                closestDistance = dist(mouse.x, mouse.y, positions[i].x, positions[i].y);
                closestIndex = i;
            }
        }

        for (let i = 0; i < positions.length; i++) {
            if (closestIndex == i) {
                ctx.fillStyle = "red";
            } else {
                ctx.fillStyle = "black";
            }

            ctx.beginPath();
            ctx.arc(positions[i].x, positions[i].y, 5, 0, 2 * Math.PI);
            ctx.fill();

            if ((this.state.currentlyDrawing == IOPowerDistribution.Type.PDH ? i < 10 : i > 7)) {
                //Draw a line right
                ctx.beginPath();
                ctx.moveTo(positions[i].x, positions[i].y);
                ctx.lineTo(positions[i].x + 30, positions[i].y);
                ctx.stroke();

                ctx.fillText(`${i < this.state.channels ? this.state.ioCurrents[i] : 0}A`, positions[i].x + 35, positions[i].y + 5);
            } else {
                //Draw a line left
                ctx.beginPath();
                ctx.moveTo(positions[i].x, positions[i].y);
                ctx.lineTo(positions[i].x - 30, positions[i].y);
                ctx.stroke();

                ctx.fillText(`${i < this.state.channels ? this.state.ioCurrents[i] : 0}A`, positions[i].x - 40 - (6 * `${this.state.ioCurrents[i]}A`.length), positions[i].y + 5);
            }
        }

        // ctx.font = "20px Arial";
        // ctx.fillText(`${mouse.x} ${mouse.y}`, 10, 20);

        // if (mouse.down && !this.state.lastMouseState) {
        //     if (mouse.x > 0 && mouse.x < 500 && mouse.y > 0 && mouse.y < 500) {
        //         if (!Object.keys(window).includes("tt")) window.tt = [];

        //         window.tt.push({
        //             x: mouse.x,
        //             y: mouse.y
        //         })
        //     }
        // }
        
        // if (window.tt) {
        //     for (let i = 0; i < window.tt.length; i++) {
        //         ctx.beginPath();
        //         ctx.arc(window.tt[i].x, window.tt[i].y, 5, 0, 2 * Math.PI);
        //         ctx.fill();
        //     }
        // }

        this.state.lastMouseState = mouse.down;
    }

    componentDidMount() {
        this.state.pdpImage = new Image();
        this.state.pdhImage = new Image();

        this.state.pdpImage.src = "images/pdp.jpeg";
        this.state.pdhImage.src = "images/pdh.png";

        this.state.pdpImage.onload = () => {
            this.state.loadedPDP = true;
        }

        this.state.pdhImage.onload = () => {
            this.state.loadedPDH = true;
        }
    }


    render() {
        return (
            <div id="io-power-distribution-parent">
                <Mover target="io-power-distribution-parent"></Mover>
                <Canvas id="io-power-distribution" 
                    width={"500px"} 
                    height={"500px"} 
                    draw={this.draw.bind(this)}
                ></Canvas>
            </div>
        )
    }
}

export default IOPowerDistribution;