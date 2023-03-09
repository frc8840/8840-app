import React from "react";
import Mover from "../../mover/Mover";
import * as THREE from "three";
import { GLTFLoader } from "../../libraries/ThreeJS/loaders/GLTFLoader";

import { addTabListener } from "../../pynetworktables2js/wrapper";
import { Angle, Unit } from "../../misc/unit";

import "./3DField.css"
import { load } from "../../save/SaveManager";
import CurrentAutoLoader, { Conjugate } from "../pathplanner/current/CurrentAutoLoader";

const fieldWidthInUnits = 16.5198098;
const fieldHeightInUnits = 8;

const unitsPerInch = fieldWidthInUnits / 651.5;

const distOfGround = 0.2;

const cameraHeight = 10;

class Field3D extends React.Component {
    static SwerveInfo = {
        width: new Unit(30, Unit.Type.INCHES),
        length: new Unit(30, Unit.Type.INCHES),
        maxVelocity: 1
    }

    static AutoLoader = null;

    //lil snippet stolen from SwerveInfo.js ¯\_(ツ)_/¯
    static {
        if (window.localStorage.getItem("robot-size") != null) {
            const size = JSON.parse(window.localStorage.getItem("robot-size"));

            Field3D.SwerveInfo.width = new Unit(size.width, Unit.Type.INCHES);
            Field3D.SwerveInfo.length = new Unit(size.length, Unit.Type.INCHES);
        }

        if (window.localStorage.getItem("swerve-settings") != null) {
            const settings = JSON.parse(window.localStorage.getItem("swerve-settings"));

            Field3D.SwerveInfo.maxVelocity = settings.maxVelocity;
        }

        setTimeout(() => {
            console.log("Created Autonomous Loader!")
            Field3D.AutoLoader = new CurrentAutoLoader();
        }, 100)
    }

    constructor(props) {
        super(props)

        this.state = {
            height: 440,
            width: 880,
            scene: null,
            camera: null,
            renderer: null,
            objects: {},
            displays: {
                path: null
            },

            robot: {
                ref: "robot",
                expectRef: "expectedRobot",
                init: false,
                position: {
                    x: new Unit(0, Unit.Type.METERS),
                    y: new Unit(0, Unit.Type.METERS),
                    rot: new Angle(0, Angle.Degrees)
                },
                expectedPos: {
                    x: new Unit(0, Unit.Type.METERS),
                    y: new Unit(0, Unit.Type.METERS),
                    rot: new Angle(0, Angle.Degrees)
                },
                update: () => {
                    if (this.state.robot.init) {
                        const robotObject = this.getObj(this.state.robot.ref);
                        
                        const x = this.state.robot.position.x;
                        const y = this.state.robot.position.y;
                        const rot = this.state.robot.position.rot;

                        const xRelative = x.getcu(unitsPerInch, Unit.Type.INCHES) - (fieldWidthInUnits / 2);
                        const yRelative = (fieldHeightInUnits / 2) - y.getcu(unitsPerInch, Unit.Type.INCHES);

                        robotObject.position.x = xRelative;
                        robotObject.position.z = yRelative;
                        robotObject.rotation.y = rot.get(Angle.Radians);

                        const expectedRobot = this.getObj(this.state.robot.expectRef);
                        const expectedX = this.state.robot.expectedPos.x;
                        const expectedY = this.state.robot.expectedPos.y;
                        const expectedRot = this.state.robot.expectedPos.rot;

                        const expectedXRelative = expectedX.getcu(unitsPerInch, Unit.Type.INCHES) - (fieldWidthInUnits / 2);
                        const expectedYRelative = (fieldHeightInUnits / 2) - expectedY.getcu(unitsPerInch, Unit.Type.INCHES);

                        expectedRobot.position.x = expectedXRelative;
                        expectedRobot.position.z = expectedYRelative;
                        expectedRobot.rotation.y = expectedRot.get(Angle.Radians);
                    }
                }
            },

            autoLoader: {
                display: -1,
                cacheDisplay: -1,
                cacheActive: true,
            },

            cameraRotation: new Angle(90, Angle.Degrees),
            cameraRotateInterval: null,
        }

        window.testload = (n) => {
            this.state.autoLoader.display = n;
        }

        window.gettest = () => {
            return Field3D.AutoLoader.conjugates;
        }

        addTabListener("all_ignore_prefix", (key, value, isNew) => {
            if (key.startsWith("SmartDashboard") || key.startsWith("/SmartDashboard")) {
                if (key.startsWith("/")) key = key.substring(1);
                
                const splitKey = key.split("/");

                if (splitKey[1] == "Field") {
                    if (splitKey[2] == "SwerveRobot") {
                        const x = new Unit(value[0], Unit.Type.METERS);
                        const y = new Unit(value[1], Unit.Type.METERS);
                        const rot = new Angle(value[2], Unit.Type.DEGREES);

                        this.state.robot.position.x = x;
                        this.state.robot.position.y = y;
                        this.state.robot.position.rot = rot;

                        this.state.robot.update();
                    } else if (splitKey[2] == "Robot") {
                        const x = new Unit(value[0], Unit.Type.METERS);
                        const y = new Unit(value[1], Unit.Type.METERS);
                        const rot = new Angle(value[2], Unit.Type.DEGREES);

                        this.state.robot.expectedPos.x = x;
                        this.state.robot.expectedPos.y = y;
                        this.state.robot.expectedPos.rot = rot;

                        this.state.robot.update();
                    }
                }
            }
        });

        this.loadPath = this.loadPath.bind(this);
        this.rotateDown = this.rotateDown.bind(this);
        this.rotateUp = this.rotateUp.bind(this);
        this.readjustCameraTopDown = this.readjustCameraTopDown.bind(this);
        this.stopRotation = this.stopRotation.bind(this);
        this.startRotation = this.startRotation.bind(this);
        this.addToScene = this.addToScene.bind(this);
        this.getObj = this.getObj.bind(this);
        this.topDown = this.topDown.bind(this);
        this.autoLoaderPaths = this.autoLoaderPaths.bind(this);
        this.removeFromScene = this.removeFromScene.bind(this);
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

    removeFromScene(name) {
        if (this.state.objects[name] != null) {
            this.state.scene.remove(this.state.objects[name]);
            delete this.state.objects[name];
        }
    }

    getObj(name) {
        return this.state.objects[name];
    }

    setup() {
        const addToScene = this.addToScene.bind(this);
        const getObj = this.getObj.bind(this);

        const loader = new GLTFLoader();

        loader.load(
            // resource URL
            `/models/field/2023_field.glb`,
            function ( object ) {
                //compute the object vertex normals
                object.scene.traverse( function ( child ) {
                    if ( child.isMesh ) {
                        child.geometry.computeVertexNormals();

                        child.castShadow = true;
                        child.wireframe = true;
                        child.receiveShadow = true;

                        if ( child.material ) child.material.metalness = 0;

                        console.log("Computed vertex normals!");
                    }
                } );

                addToScene("field", object.scene);
                console.log("Added object!")
            },
            function (xhr) {},
            function (error) {
                console.log( 'An error happened', error );
            }
        );

        //Create the robot, it'll just be a cube with dimensions of the robot
        const robotGeometry = new THREE.BoxGeometry(
            Field3D.SwerveInfo.width.getcu(unitsPerInch, Unit.Type.INCHES), 
            0.2, 
            Field3D.SwerveInfo.length.getcu(unitsPerInch, Unit.Type.INCHES)
        );
        const robotMaterial = new THREE.MeshBasicMaterial({
            color: 0x6db58d
        });

        const robot = new THREE.Mesh(robotGeometry, robotMaterial);
        robot.position.x = 0;
        robot.position.y = 0.21;
        robot.position.z = 0;

        addToScene(this.state.robot.ref, robot);

        const robotExpectedGeometry = new THREE.BoxGeometry(
            Field3D.SwerveInfo.width.getcu(unitsPerInch, Unit.Type.INCHES),
            0.2,
            Field3D.SwerveInfo.length.getcu(unitsPerInch, Unit.Type.INCHES)
        );
        const robotExpectedMaterial = new THREE.MeshBasicMaterial({
            color: 0x03fcd7
        });
        
        const robotExpected = new THREE.Mesh(robotExpectedGeometry, robotExpectedMaterial);
        robotExpected.position.x = 0;
        robotExpected.position.y = 0.21;
        robotExpected.position.z = 0;

        addToScene(this.state.robot.expectRef, robotExpected);

        this.state.robot.init = true;
        this.state.robot.update();

        var light = new THREE.AmbientLight(0xFFFFFF, 1); // soft white light
        light.position.set(0, 1, 0);
        addToScene("light", light);

        //create a cube
        // const cubeGeometry = new THREE.BoxGeometry(fieldWidthInUnits, 0.1, fieldHeightInUnits);
        // const cubeMaterial = new THREE.MeshBasicMaterial({
        //     color: 0x00ff00
        // });
        // const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        // cube.position.x = 0;
        // cube.position.y = 0.01;
        // cube.position.z = 0;

        // addToScene("cube", cube)

        this.state.camera.position.z = 0;
        this.state.camera.position.y = cameraHeight;
        //angle it down a bit
        this.state.camera.rotation.x = Angle.toRadians(-90);

        this.animate.bind(this)();
    }

    animate() {
        const getObj = this.getObj.bind(this);

        if (Field3D.AutoLoader && Field3D.AutoLoader.success) {
            //console.log(this.state.autoLoader.cacheDisplay, Field3D.AutoLoader.onIndex)

            if (this.state.autoLoader.cacheDisplay != Field3D.AutoLoader.onIndex) {
                this.state.autoLoader.cacheDisplay = Field3D.AutoLoader.onIndex;
                this.state.autoLoader.display = Field3D.AutoLoader.onIndex;
                console.log("Switched paths, detected change!")
                this.autoLoaderPaths();
            }

            if (this.state.autoLoader.cacheActive != Field3D.AutoLoader.active) {
                this.state.autoLoader.cacheActive = Field3D.AutoLoader.active;

                if (Field3D.AutoLoader.active) {
                    this.state.autoLoader.display = 0;
                    this.state.autoLoader.cacheDisplay = 0;
                } else {
                    this.state.autoLoader.display = Field3D.AutoLoader.conjugates.length;
                }

                this.autoLoaderPaths();
            }
        }

        requestAnimationFrame( this.animate.bind(this) );

        this.state.renderer.render( this.state.scene, this.state.camera );
    }

    loadPath() {
        const nameOfPath = prompt("Enter the name of the path to load: ");
        if (nameOfPath) {
            const local_path = "gen_path/" + nameOfPath + ".json";

            //it's stored in local storage, so we can just get it
            let path = load(local_path);

            if (path) {
                console.log("Loaded path!", path);

                // for (let i = 0; i < path.positions.length; i++) {
                //     const type = path.positions[i].type;
                //     const x = new Unit(path.positions[i].x, Unit.Type.INCHES);
                //     const y = new Unit(path.positions[i].y, Unit.Type.INCHES);
                    
                //     const markingSphere = new THREE.SphereGeometry(0.1, 32, 32);
                //     const markingMaterial = new THREE.MeshBasicMaterial({
                //         color: type == "hardpoint" ? 0x00ff00 : 0xff0000
                //     });
                //     const marking = new THREE.Mesh(markingSphere, markingMaterial);

                //     marking.position.x = (fieldWidthInUnits / 2) - (x.getcu(unitsPerInch, Unit.Type.INCHES));
                //     marking.position.y = 0.1;
                //     marking.position.z = (fieldHeightInUnits / 2) - y.getcu(unitsPerInch, Unit.Type.INCHES) //- (fieldHeightInUnits / 2);

                //     this.addToScene("path-" + i, marking);

                //     console.log("Added path point! ", x.to(Unit.Type.METERS), y.to(Unit.Type.METERS));
                // }

                for (let i = 0; i < path.generatedTimeline.length - 1; i++) {
                    const genData = path.generatedTimeline[i][0];
                    const nextGenData = path.generatedTimeline[i + 1][0];
                    
                    const position = genData.data.position;
                    const nextPosition = nextGenData.data.position;

                    const x = new Unit(position.x, Unit.Type.INCHES);
                    const y = new Unit(position.y, Unit.Type.INCHES);

                    const nextX = new Unit(nextPosition.x, Unit.Type.INCHES);
                    const nextY = new Unit(nextPosition.y, Unit.Type.INCHES);

                    const xSimRel = (fieldWidthInUnits / 2) - (x.getcu(unitsPerInch, Unit.Type.INCHES));
                    const ySimRel = (fieldHeightInUnits / 2) - y.getcu(unitsPerInch, Unit.Type.INCHES);

                    const nextXSimRel = (fieldWidthInUnits / 2) - (nextX.getcu(unitsPerInch, Unit.Type.INCHES));
                    const nextYSimRel = (fieldHeightInUnits / 2) - nextY.getcu(unitsPerInch, Unit.Type.INCHES);

                    //make a line between the two points
                    const lineGeometry = new THREE.BufferGeometry();
                    const lineMaterial = new THREE.LineBasicMaterial({
                        color: 0xf126ff
                    });

                    const linePoints = [
                        new THREE.Vector3(xSimRel, distOfGround, ySimRel),
                        new THREE.Vector3(nextXSimRel, distOfGround, nextYSimRel)
                    ];

                    lineGeometry.setFromPoints(linePoints);

                    const line = new THREE.Line(lineGeometry, lineMaterial);

                    this.addToScene("gen-" + i, line);
                }

                //add circle at 0, 0
                // const circleGeometry = new THREE.CircleGeometry(0.5, 32);
                // const circleMaterial = new THREE.MeshBasicMaterial({
                //     color: 0x0000ff
                // });
                // const circle = new THREE.Mesh(circleGeometry, circleMaterial);

                // circle.position.x = 0;
                // circle.position.y = 0.5;
                // circle.position.z = 0;

                // this.addToScene("path-10", circle);
            }
        }
    }

    startRotation(up=true) {
        this.state.cameraRotateInterval = setInterval(() => {
            if (up) {
                this.rotateUp();
            } else {
                this.rotateDown();
            }
        }, 10);
    }

    stopRotation() {
        clearInterval(this.state.cameraRotateInterval);
    }

    rotateDown() {
        this.state.cameraRotation.subtract(new Angle(1, Angle.Type.DEGREES));
        this.readjustCameraTopDown();
    }

    rotateUp() {
        this.state.cameraRotation.add(new Angle(1, Angle.Type.DEGREES));
        this.readjustCameraTopDown();
    }

    topDown() {
        this.state.cameraRotation = new Angle(90, Angle.Type.DEGREES);
        this.readjustCameraTopDown();
    }

    readjustCameraTopDown() {
        const newRot = this.state.cameraRotation.get(Angle.Radians);
        const newRotZ = Math.cos(newRot) * cameraHeight;
        const newRotY = Math.sin(newRot) * cameraHeight;

        this.state.camera.position.z = newRotZ;
        this.state.camera.position.y = newRotY;
        
        //Make the camera look at 0,0
        this.state.camera.lookAt(0, 0, 0);   
    }

    autoLoaderPaths() {
        let pathColors = [
            0xe5f759,
            0x5abfba,
            0xed8045,
            0xa445ed,
            0xdb27a5,
            0xe34720,
            0x4ae320,
            0x9726de,
            0x1f9bde,
            0x1fde9b,
            0x9b1fde,
            0xde1f9b,
        ];

        const defaultColor = 0xed1cd5;

        let pths = 0;

        //first we'll remove all the path objects
        for (let key of Object.keys(this.state.objects)) {
            if (key.startsWith("ap-c-")) {
                this.removeFromScene(key);
            }
        }

        //console.log("Loading paths! Count", Field3D.AutoLoader.conjugates.length)
        for (let i = 0; i < Field3D.AutoLoader.conjugates.length; i++) {
            if (!(i == this.state.autoLoader.display || this.state.autoLoader.display == Field3D.AutoLoader.conjugates.length)) {
                continue;
            }

            const conjugate = Field3D.AutoLoader.conjugates[i];

            if (conjugate.type != Conjugate.Type.Path) {
                continue;
            }

            pths++;

            const path = conjugate.path;

            for (let j = 0; j < path.length - 1; j++) {
                const position = path[j];
                const nextPosition = path[j + 1];

                const x = new Unit(position.x, Unit.Type.INCHES);
                const y = new Unit(position.y, Unit.Type.INCHES);

                const nextX = new Unit(nextPosition.x, Unit.Type.INCHES);
                const nextY = new Unit(nextPosition.y, Unit.Type.INCHES);

                const xSimRel = (fieldWidthInUnits / 2) - (x.getcu(unitsPerInch, Unit.Type.INCHES));
                const ySimRel = (fieldHeightInUnits / 2) - y.getcu(unitsPerInch, Unit.Type.INCHES);

                const nextXSimRel = (fieldWidthInUnits / 2) - (nextX.getcu(unitsPerInch, Unit.Type.INCHES));
                const nextYSimRel = (fieldHeightInUnits / 2) - nextY.getcu(unitsPerInch, Unit.Type.INCHES);

                //make a line between the two points
                const lineGeometry = new THREE.BufferGeometry();
                const lineMaterial = new THREE.LineBasicMaterial({
                    color: i < pathColors.length ? pathColors[i] : defaultColor
                });

                const linePoints = [
                    new THREE.Vector3(xSimRel, distOfGround, ySimRel),
                    new THREE.Vector3(nextXSimRel, distOfGround, nextYSimRel)
                ];

                lineGeometry.setFromPoints(linePoints);

                const line = new THREE.Line(lineGeometry, lineMaterial);

                this.addToScene("ap-c-" + i + "-" + j, line);
            }

            //console.log("Added path " + i);
        }
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
                <button onClick={this.loadPath}>Load Path</button>
                <br/><br/>
                <button onMouseDown={() => { this.startRotation(false); }} onMouseUp={this.stopRotation} onMouseLeave={ this.stopRotation }>\/</button>
                <button onMouseDown={() => { this.startRotation(true); }} onMouseUp={this.stopRotation} onMouseLeave={ this.stopRotation }>/\</button>
                <button onClick={() => { this.topDown() }}>Reset Top Down View</button>
                <br/>
                <button onClick={this.autoLoaderPaths}>Update Autonomous Display</button>
            </div>
        )
    }
}

export default Field3D;