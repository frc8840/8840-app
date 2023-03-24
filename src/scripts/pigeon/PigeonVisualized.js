import React from "react";
import Mover from "../mover/Mover";
import * as THREE from "three";
import { OBJLoader } from "../libraries/ThreeJS/loaders/OBJLoader";

import "./PigeonVisualized.css"
import { addTabListener } from "../pynetworktables2js/wrapper";
import { Angle } from "../misc/unit";

class PigeonVisualized extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            height: 300,
            width: 300,
            scene: null,
            camera: null,
            renderer: null,
            objects: {},
            info: {
                roll: 0,
                pitch: 0,
                yaw: 0,
            },
            topDown: false,
        }

        addTabListener("IO", (key, value, isNew) => {
            if (key.startsWith("Pigeon Gyroscope")) {
                const split = key.split("/");
                const gsk = (i) => {
                    if (split.length <= i) return "";
                    return split[i];
                }

                //ex: Pigeon Gyroscope/0/yaw pitch roll/value

                const isYawPitchRoll = gsk(2) == "yaw pitch roll";
                const isValue = gsk(3) == "v";
                
                if (isValue && isYawPitchRoll) {
                    this.state.info = {
                        yaw: value[0],
                        pitch: value[1],
                        roll: value[2],
                    }
                }
            }
        });
    }

    addToScene(name, obj) {
        //if the object already exists, remove it
        if (this.state.objects[name] != null) {
            this.state.scene.remove(this.state.objects[name]);
        }
        //cehck the scene list as well
        if (this.state.scene.children.includes(obj)) {
            this.state.scene.remove(obj);
        }

        this.state.scene.add(obj);
        this.state.objects[name] = obj;
    }

    getObj(name) {
        return this.state.objects[name];
    }

    setup() {
        const addToScene = this.addToScene.bind(this);
        const getObj = this.getObj.bind(this);

        const loader = new OBJLoader();

        loader.load(
            // resource URL
            `/models/pigeon2.obj`,
            function ( object ) {
                addToScene("pigeon", object);
                getObj("pigeon").scale.set(0.05, 0.05, 0.05);
                getObj("pigeon").position.set(0, -1, 0);
                //SET COLor to green
                getObj("pigeon").children[0].material.color.setHex(0x00ff00);
            },
            function ( xhr ) {
                console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
            },
            function ( error ) {
                console.log( 'An error happened', error );
            },
        );

        var light = new THREE.AmbientLight(0xFFFFFF, 1); // soft white light
        addToScene("light", light);

        this.state.camera.position.z = 5;

        this.animate.bind(this)();
    }

    animate() {
        const getObj = this.getObj.bind(this);
        requestAnimationFrame( this.animate.bind(this) );

        if (getObj("pigeon") != null) {
            const { yaw, pitch, roll } = this.state.info;

            //Rotate the pigeon to the yaw, pitch, and roll
            getObj("pigeon").rotation.set(Angle.toRadians(pitch) - Math.PI / 2, Angle.toRadians(roll), Angle.toRadians(yaw));
        }

        this.state.renderer.render( this.state.scene, this.state.camera );
    }

    componentDidMount() {
        const scene = new THREE.Scene();

        scene.background = new THREE.Color( '#ffffff' );

        const camera = new THREE.PerspectiveCamera( 75, this.state.width / this.state.height, 0.1, 1000 );

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize( this.state.width, this.state.height );

        this.state.scene = scene;
        this.state.camera = camera;
        this.state.renderer = renderer;

        this.setup.bind(this)();

        document.getElementById("pigeon-vis-canvas-parent").innerHTML = "";
        document.getElementById("pigeon-vis-canvas-parent").appendChild( renderer.domElement );
    }

    toggleView() {
        this.state.topDown = !this.state.topDown;

        const camera = this.state.camera;

        if (!this.state.topDown) {
            camera.position.set(0, 0, 5);
            camera.rotation.set(0, 0, 0);
        } else {
            camera.position.set(0, 5, 0);
            camera.rotation.set(-Math.PI / 2, 0, 0);
        }
    }

    render() {
        return (
            <div id={"pigeon-vis-parent"} className="plotter">
                <Mover target={"pigeon-vis-parent"}></Mover>
                <div id={"pigeon-vis-canvas-parent"}>

                </div>
                <button style={{ marginTop: "5px"}} onClick={this.toggleView.bind(this)}>Toggle View</button>
            </div>
        )
    }
}

export default PigeonVisualized;