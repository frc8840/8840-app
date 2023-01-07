import React from "react";
import Canvas from "../../canvas/Canvas";
import Mover from "../../mover/Mover";

import './IOPD.css'

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
            currentlyDrawing: IOPowerDistribution.Type.PDP,
            loadedPDP: false,
            loadedPDH: false
        }
    }

    draw(ctx) {
        ctx.clearRect(0, 0, 500, 500);
        
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 500, 500);

        const image = this.state.currentlyDrawing == IOPowerDistribution.Type.PDP ? this.state.pdpImage : this.state.pdhImage;

        const iwidth = image != null ? image.width : 500;
        const iheight = image != null ? image.height : 500;

        if (this.state.loadedPDH && this.state.loadedPDP && image != null) {
            ctx.save();
            ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
            ctx.drawImage(image, -(iwidth / 2), -(iheight / 2), iwidth, iheight);
            ctx.restore();
        }

        ctx.fillStyle = "black";
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