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
import IOPowerDistribution from "../../scripts/io/pd/IOPowerDistribution";
import BlockPage from "../blocks/BlockPage";
import IOCanCoder from "../../scripts/io/cancoder/IOCanCoder";
import IOSwerveModule from "../../scripts/io/swerve/IOSwerve";
import PigeonVisualized from "../../scripts/pigeon/PigeonVisualized";
import Field3D from "../../scripts/field/3D/3DField";
import Dashboard from "../dashboard/Dashboard";
import IOEditor from "../../scripts/io/editor/IOEditor";
import LoadLog from "../../scripts/logs/parser/LoadLog";
import LogPlayback from "../../scripts/logs/playback/LogPlayback";
import CustomPage from "../custom/CustomPage";
import Finder from "../../scripts/files/Finder";
import PathSettings from "../../scripts/field/pathplanner/settings/PathSettings";

function Home() {
    const [params, setSearchParams] = useSearchParams();

    let tab = (<Dashboard></Dashboard>)

    let useHosting = true;

    console.log("Loading tab: " + params.has("tab") ? params.get("tab") : "No tab specified.")

    if (params.get("tab") == "home") {
        tab = (
            <div>
                <Field game={"chargedUp"}></Field>
                <SpeedCC></SpeedCC>
                <SwerveInfo></SwerveInfo>
                <PathSelector></PathSelector>
            </div>
        );
    } else if (params.get("tab") === "nn") {
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
                <Field inchToPixel={1.5} simtype={Field.SimulType.Planning} game={"chargedUp"}></Field>
                <PathSelector></PathSelector>
                <PathSettings></PathSettings>
                <Finder></Finder>
            </div>
        )
    } else if (params.get("tab") === "till") {
        tab = (<Till></Till>);
        useHosting = false;
    } else if (params.get("tab") === "blocks") {
        tab = (
            <div style={{
                width: "100vw", 
                height: "100vh",
                backgroundColor: "#242424"
            }}>
                <BlockPage></BlockPage>
            </div>
        )
        useHosting = false;
        return (tab);
    } else if (params.get("tab") === "controls") {
        tab = (
            <div>
                <SimControls type={SimControls.Type.Joystick}></SimControls>
                <SimControls type={SimControls.Type.Rotation}></SimControls>
                <SimControls type={SimControls.Type.Button}></SimControls>
                <SimControls type={SimControls.Type.FOV}></SimControls>
                <IOSwerveModule></IOSwerveModule>
                <PigeonVisualized></PigeonVisualized>
                <PathSelector></PathSelector>
                <SwerveInfo></SwerveInfo>
            </div>
        )
    } else if (params.get("tab") === "io") {
        tab = (
            <div>
                <PigeonVisualized></PigeonVisualized>
                <IOPowerDistribution></IOPowerDistribution>
                <IOCanCoder></IOCanCoder>
                <IOSwerveModule></IOSwerveModule>
                <IOEditor></IOEditor>
                <Finder></Finder>
            </div>
        )
    } else if (params.get("tab") == "3d") {
        tab = (
            <div>
                <Field3D></Field3D>
                <PathSelector></PathSelector>
            </div>
        )
    } else if (params.get("tab") == "log") {
        tab = (
            <div>
                <LoadLog></LoadLog>
                <LogPlayback></LogPlayback>
                <SwerveInfo log={true}></SwerveInfo>
            </div>
        )
    } else if (params.get("tab") == "custom") {
        tab = (
            <div>
                <CustomPage></CustomPage>
            </div>
        )
    } else {
        useHosting = false;
    }

    return (
        <div className="home">
            {useHosting ? (<Hosting />) : (<div></div>)}
            {tab}
        </div>
    );
}

export default Home;