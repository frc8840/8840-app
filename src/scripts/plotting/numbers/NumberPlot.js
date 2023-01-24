import React from "react";
import { addTabListener } from "../../pynetworktables2js/wrapper";

import "./NumberPlot.css";

window.numberplotkeygenerator = (function*() {
    let i = 0;
    while (true) {
        yield i++;
    }
});

class NumberPlot extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            key: window.numberplotkeygenerator.next().value,
            monitoring: "",
            history: [],
            maxTime: 5000,
        }

        addTabListener("all", (key, value, isNew) => {
            if (this.state.monitoring == key) {
                this.state.history.push({
                    t: Date.now(),
                    v: value,
                });
            }
        });
    }

    draw(ctx, frameCount, rel, canvas, mouse) {
        //clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        //white background
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const middle = (ctx.canvas.height) / 2;
        const perPoint01 = middle / 12;

        const range = this.state.history[this.state.history.length - 1].t - this.state.history[0].t;

        const maxHeight = 100;

        ctx.strokeStyle = "gray";
        ctx.lineWidth = 1;
        ctx.moveTo(0, middle);
        ctx.lineTo(ctx.canvas.width, middle);
        ctx.stroke();

        ctx.strokeStyle = "black";
        ctx.lineWidth = 1;

        const adjustedList = this.state.history.map(e => {
            return {
                t: e.t - this.state.history[0].t,
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
            this.state.history = this.state.history.filter((e) => {
                return this.state.history[this.state.history.length - 1].t - e.t < this.state.maxTime;
            })
        }
    }

    setMonitoring() {
        const newMonitor = prompt("Enter the key to monitor", this.state.monitoring);
        if (newMonitor != null) {
            this.state.monitoring = newMonitor;
            document.getElementById(this.state.key + "-monitor-key").innerText = this.state.monitoring;
        }
    }

    render() {
        const refID = this.state.key + "-plot-parent";

        return (
            <div id={refID} className="nplotter-parent">
                <Mover target={refID}></Mover>
                <Canvas id={refID}
                    width={"200px"} 
                    height={"200px"} 
                    draw={this.draw.bind(this)}
                ></Canvas>
                <p style={{color: "white"}}>Monitoring: <span id={this.state.key + "-monitor-key"}>None</span></p>
            </div>
        )
    }
}

export default NumberPlot;