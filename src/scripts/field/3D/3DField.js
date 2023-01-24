import React from "react";
import Mover from "../../mover/Mover";
import * as THREE from "three";
import { OBJLoader } from "../../libraries/ThreeJS/OBJLoader";

import { addTabListener } from "../../pynetworktables2js/wrapper";
import { Angle } from "../../misc/unit";

import "./3DField.css"

class Field3D extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            height: 450,
            width: 625,
            scene: null,
            camera: null,
            renderer: null,
            objects: {}
        }

        addTabListener("IO", (key, value, isNew) => {
            
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
            `/models/field/fieldobj.obj`,
            function ( object ) {
                addToScene("field", object);
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

        this.state.camera.position.z = 20;

        this.animate.bind(this)();
    }

    animate() {
        const getObj = this.getObj.bind(this);
        requestAnimationFrame( this.animate.bind(this) );

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

        document.getElementById("field-3d-canvas-parent").innerHTML = "";
        document.getElementById("field-3d-canvas-parent").appendChild( renderer.domElement );
    }

    render() {
        return (
            <div id={"field-3d-parent"} className="plotter">
                <Mover target={"field-3d-parent"}></Mover>
                <div id={"field-3d-canvas-parent"}>
                </div>
            </div>
        )
    }
}

export default Field3D;