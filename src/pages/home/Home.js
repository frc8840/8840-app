import React from "react";
import Hosting from "../../scripts/hosting/Hosting";
import { useSearchParams } from 'react-router-dom'
import nn from "../../scripts/ai/nn"
import Canvas from "../../scripts/canvas/Canvas";
import SwerveInfo from "../../scripts/swerve/SwerveInfo";

import SpeedCC from "../../scripts/speed-controllers/SpeedCC";

import "./Home.css"
import Field from "../../scripts/field/Field";
import Till from "../till/Till";
import PathSelector from "../../scripts/field/pathplanner/selector/PathSelector";
import SimControls from "../../scripts/controls/SimControls";

function Home() {
    const [params, setSearchParams] = useSearchParams();

    let tab = (
        <div>
            <Field></Field>
            <SpeedCC></SpeedCC>
            <SwerveInfo></SwerveInfo>
            <PathSelector></PathSelector>
        </div>
    );

    let useHosting = true;

    console.log("Loading tab: " + params.has("tab") ? params.get("tab") : "No tab specified.")

    if (params.get("tab") === "nn") {
        tab = (
            <div className="neural-parent">
                <nn.ReactNN 
                size={"400px"}
                input_nodes={2}
                hidden_nodes={[8, 8]}
                output_nodes={1}
                learning_rate={0.1}
                training_data={{
                    inputs: [
                        [0, 0],
                        [0, 1],
                        [1, 0],
                        [1, 1]
                    ],
                    targets: [
                        [0],
                        [1],
                        [1],
                        [0],
                    ],
                    epochs: 10000,
                    batchSize: 1
                }}
                />
            </div>
        );
    } else if (params.get("tab") == "path_planner") {
        tab = (
            <div>
                <Field inchToPixel={1.5} simtype={Field.SimulType.Planning}></Field>
                <PathSelector></PathSelector>
            </div>
        )
    } else if (params.get("tab") === "till") {
        tab = (<Till></Till>);
        useHosting = false;
    } else if (params.get("tab") === "controls") {
        tab = (
            <div>
                <SimControls type={SimControls.Type.Joystick}></SimControls>
                <SimControls type={SimControls.Type.Rotation}></SimControls>
                <SimControls type={SimControls.Type.Button}></SimControls>
                <SimControls type={SimControls.Type.FOV}></SimControls>
                <PathSelector></PathSelector>
                <SwerveInfo></SwerveInfo>
            </div>
        )
    }

    return (
        <div className="home">
            {useHosting ? (<Hosting />) : (<div></div>)}
            {tab}
        </div>
    );
}

export default Home;