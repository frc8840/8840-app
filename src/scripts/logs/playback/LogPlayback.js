import { mdiPause, mdiPlay, mdiStop } from "@mdi/js";
import Icon from "@mdi/react";
import React from "react";
import Canvas from "../../canvas/Canvas";
import Mover from "../../mover/Mover";
import LogAnalyzer from "./LogAnalyzer";

import "./LogPlayback.css"

function formatTime(millis) {
    let seconds = "" + (Math.floor(millis / 1000) % 60);
    let minutes = "" + Math.floor(millis / 1000 / 60);

    if (seconds.length == 1) seconds = "0" + seconds;

    return {seconds, minutes};
}

class LogPlayback extends React.Component {
    static Buttons = {
        PLAY: 0,
        PAUSE: 1,
        STOP: 2,
    }
    constructor(props) {
        super(props);

        if (!Object.keys(window).includes("loga")) {
            window.loga = new LogAnalyzer();
        }

        this.state = {
            activeButton: LogPlayback.Buttons.STOP,
            maxTime: 0,
            currentTime: 0,
            lastPlay: 0,
        }

        setTimeout(() => {
            window.log.awaitToFinish().then(() => {
                setTimeout(() => {
                    this.state.maxTime = window.loga.maxTime;

                    this.updateTimes();
                    this.changeButton(LogPlayback.Buttons.STOP);
                }, 10)
            })
        }, 100)

        this.changeButton = this.changeButton.bind(this);
        this.updateTimes = this.updateTimes.bind(this);
    }
    updateTimes() {
        const ctime = formatTime(this.state.currentTime);
        document.getElementById("time-through").innerHTML = ctime.minutes + ":" + ctime.seconds;
        const mtime = formatTime(this.state.maxTime);
        document.getElementById("max-time").innerHTML = mtime.minutes + ":" + mtime.seconds;
    }
    changeButton(to) {
        this.state.activeButton = to;
        const playButton = document.getElementById("playback-play-button");
        const pauseButton = document.getElementById("playback-pause-button");
        const stopButton = document.getElementById("playback-stop-button");

        //remove active style 
        playButton.style = "";
        pauseButton.style = "";
        stopButton.style = "";

        switch (to) {
            case LogPlayback.Buttons.PLAY:
                playButton.style = "box-shadow: none;";
                this.state.lastPlay = 0;
                break;
            case LogPlayback.Buttons.PAUSE:
                pauseButton.style = "box-shadow: none;";
                break;
            case LogPlayback.Buttons.STOP:
                stopButton.style = "box-shadow: none;";
                this.state.currentTime = 0;
                window.loga.playback = 0;
                this.updateTimes();
                break;
        }
    }
    draw(ctx, frameCount, rel, canvas, mouse) {
        ctx.fillStyle = "#616161";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const maxTime = window.loga.maxTime;

        if (maxTime == 0) {
            ctx.fillStyle = "#ffffff";
            ctx.font = "20px Arial";
            ctx.fillText("No log loaded! Load one using the log loader.", 10, 25);
            return;
        }

        const pixelPerSecond = canvas.width / (maxTime / 1000);

        for (let t = 0; t <= maxTime; t += maxTime / 10) {
            //Draw a tick mark
            const x = t / 1000 * pixelPerSecond;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x, 0, 1, 10);
            
            //Draw the time
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px Arial";
            const tFormat = formatTime(t);
            ctx.fillText(tFormat.minutes + ":" + tFormat.seconds, x + 2, 10);

            //Draw the line
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(x, 10, 1, canvas.height - 10);
        }

        for (let t = 0; t <= maxTime; t += maxTime / 100) {
            //skip all of the maxTime / 10 ticks
            if (t % (maxTime / 10) == 0) continue;

            //Draw a tick mark
            const x = t / 1000 * pixelPerSecond;
            ctx.fillStyle = "#999999";
            ctx.fillRect(x, canvas.height - 10, 1, 10);
        }

        //DRAW THE CURRENT TIME
        const currentTime = this.state.currentTime;
        const x = currentTime / 1000 * pixelPerSecond;
        //red
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(x, 0, 1, canvas.height);

        if (mouse.x > 0 && mouse.x < canvas.width && mouse.y > 0 && mouse.y < canvas.height) {
            const time = mouse.x / pixelPerSecond * 1000;

            const ftime = formatTime(time);
            ctx.fillStyle = "#ffffff";
            ctx.font = "10px Arial";
            ctx.fillText(ftime.minutes + ":" + ftime.seconds, mouse.x + 3, canvas.height - 15);
            //draw a line
            ctx.fillStyle = "#a82828";
            ctx.fillRect(mouse.x, 0, 1, canvas.height);

            if (mouse.down) {
                this.state.currentTime = time;
                this.updateTimes();

                window.loga.playback = time;
            }
        }

        if (this.state.activeButton == LogPlayback.Buttons.PLAY) {
            if (this.state.lastPlay == 0) {
                this.state.lastPlay = Date.now();
            }

            const timePassed = Date.now() - this.state.lastPlay;

            this.state.currentTime += timePassed;

            this.state.lastPlay = Date.now();

            this.updateTimes();

            window.loga.playback = this.state.currentTime;

            if (this.state.currentTime > this.state.maxTime) {
                this.changeButton(LogPlayback.Buttons.STOP);
            }
        }
    }
    render() {
        return (
            <div id="log-playback-parent">
                <Mover target={"log-playback-parent"}></Mover>
                <Canvas id="log-playback-canvas" 
                    width={700} 
                    height={50} 
                    draw={this.draw.bind(this)}
                ></Canvas>
                <div className="log-playback-controls">
                    <button onClick={() => {this.changeButton(LogPlayback.Buttons.PLAY)}} id="playback-play-button"><Icon path={mdiPlay} size={1}/></button>
                    <button onClick={() => {this.changeButton(LogPlayback.Buttons.PAUSE)}} id="playback-pause-button"><Icon path={mdiPause} size={1}/></button>
                    <button onClick={() => {this.changeButton(LogPlayback.Buttons.STOP)}} id="playback-stop-button"><Icon path={mdiStop} size={1}/></button>
                </div>
                <div className="log-playback-info" style={{color: "white"}}>
                    <p>Time: <span id="time-through">0:00</span> / <span id="max-time">0:00</span></p>
                </div>
            </div>
        )
    }
}

export default LogPlayback;