import React from 'react';

import "./SwerveInfo.css";

import Mover from '../mover/Mover';
import Canvas from '../canvas/Canvas';

import { addTabListener } from "../pynetworktables2js/wrapper"

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
            modules: newMods
        }

        addTabListener("swerve_drive", (key, value, isNew) => {
            //Check if it's not a module, rather a name.
            const splitKey = key.split("_");
            if (splitKey[0] != "module") {
                if (key == "name") {
                    this.setState({
                        swerveName: value
                    })
                }
                return;
            }

            //Get info
            const modNum = splitKey[1];

            //Used for replacing
            const initialBit = splitKey[0] + "_" + splitKey[1] + "/";
            
            //Get the module data key
            const variable = key.replace(initialBit, "")

            //Set state
            this.state.modules[modNum][variable] = value;
        })
    }
    draw(ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = "black";

        ctx.font = "13px Arial";
        ctx.fillText("Swerve - \"" + this.state.swerveName + "\"", 10, 20);
        
        for (let i = 0; i < this.state.modules.length; i++) {
            const mod = this.state.modules[i];
            ctx.fillText(
                (i + 1) + ": " + (Math.floor(mod.rotation * 100) / 100) + "°, (last: " + (Math.floor(mod.last_angle * 100) / 100) + "°), " + (Math.floor(mod.velocity_ms * 100) / 100) + "m/s, " + (Math.floor(mod.speed * 100) + "%"), 
                10, 40 + (i * 20)
            );
        }
    }
    render() {
        return (
            <div id="swerve-info-parent">
                <Mover target="swerve-info-parent"></Mover>
                <Canvas id="swerve-info" 
                    width={"200px"} 
                    height={"200px"} 
                    draw={this.draw.bind(this)}
                ></Canvas>
            </div>
        )
    }
}

export default SwerveInfo;