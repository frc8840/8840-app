import React from "react";
import Canvas from "../canvas/Canvas";
import {Unit,Angle} from "../misc/unit"
import Mover from "../mover/Mover";

import PID from "../pid/PID";

import circleIntersectsWithTriangle from "../misc/intersect";

import fractorial from "../misc/fractorial";

import { Ball, Physical } from "./PlayObj";

import {dist, prettyMuchSamePoint} from "../misc/dist";

import PathPlanner from "./pathplanner/PathPlanner";
import TimelinePlanner from "./pathplanner/TimelinePlanner";

import "./Field.css"

const degreeDifference = 15;

const pathDeltaTime = 0.03125;

const baseDistanceBetweenPoints = 3;

/*
       @---------------------\
height |---]   :•  "_"  •:      |
       |       :.  ^  .:  [---|
        \---------------------@
                width
*/
const rapidReact = {
    autonomousLength: 15,
    field: {
        width: {
            halfMeasure: new Unit(324, Unit.Type.INCHES),
            fullMeasure: new Unit(324 * 2, Unit.Type.INCHES),
        },
        height: {
            halfMeasure: new Unit(162, Unit.Type.INCHES),
            fullMeasure: new Unit(162 * 2, Unit.Type.INCHES),
        }
    },
    terminals: {
        /*
(play wall)
         |
    m    | \   w
    i    |  \   i
    s    |   \   d
    s    |    \   t
    i    |     \   h
    n    |-------------------
    g     missing  (side wall)
    */

        angleFromSideWall: new Angle(133.75, Angle.Degrees),
        angleFromPlayWall: new Angle(180 - 133.75, Angle.Degrees),
        missingFromWalls: new Unit(92.5 * Math.sin(new Angle(180 - 133.75, Angle.Degrees).get(Angle.Radians)), Unit.Type.INCHES),
        terminalLength: new Unit(92.5, Unit.Type.INCHES),
    },
    launchPads: {
        /*
        (way too long but lol)
        * is starting point
            --*--
           /  p  \
          /       \
          \   t   /
           \     /
            \   /
             \./ 
        */
        pentagram: { //the p
            top: new Unit(46.89, Unit.Type.INCHES),
            sides: new Unit(75.07, Unit.Type.INCHES),
            bottom: new Unit(153, Unit.Type.INCHES),

            triangles: {
                length: new Unit(Math.sqrt(Math.pow(75.07, 2) / 2), Unit.Type.INCHES),
            }
        },
        triangle: { //the t
            hypotenuse: new Unit(153, Unit.Type.INCHES),
            sides: new Unit(82.83, Unit.Type.INCHES),
        },
        height: new Unit(84.75, Unit.Type.INCHES),
        middleToStart: new Unit(118.66 - 84.75, Unit.Type.INCHES),
        draw(ctx, angle=new Angle(30, Angle.Degrees), start_={x: 0, y: 0}, i2p=inchToPixel) {

            let start = {x:0,y:0};
            
            let topLeftCorner = {
                x: start.x - (this.pentagram.top.getcu(i2p, Unit.Type.INCHES) / 2),
                y: start.y
            }
            let topRightCorner = {
                x: topLeftCorner.x + this.pentagram.top.getcu(i2p, Unit.Type.INCHES),
                y: start.y
            }
            let middleLeftCorner = {
                x: start.x - (this.triangle.hypotenuse.getcu(i2p, Unit.Type.INCHES) / 2),
                y: start.y + this.pentagram.triangles.length.getcu(i2p, Unit.Type.INCHES)
            }
            let middleRightCorner = {
                x: start.x + (this.triangle.hypotenuse.getcu(i2p, Unit.Type.INCHES) / 2),
                y: start.y + this.pentagram.triangles.length.getcu(i2p, Unit.Type.INCHES)
            }
            let bottom = {
                x: start.x,
                y: start.y + this.height.getcu(i2p, Unit.Type.INCHES)
            }

            ctx.save();
            ctx.translate(start_.x, start_.y);
            ctx.rotate(angle.get(Angle.Radians));
            ctx.beginPath();
            ctx.lineTo(topLeftCorner.x, topLeftCorner.y);
            ctx.lineTo(middleLeftCorner.x, middleLeftCorner.y);
            ctx.lineTo(bottom.x, bottom.y);
            ctx.lineTo(middleRightCorner.x, middleRightCorner.y);
            ctx.lineTo(topRightCorner.x, topRightCorner.y);
            ctx.lineTo(start.x, start.y);
            ctx.fill();
            ctx.restore();
        }
    },
    middleLine: {
        pointToMiddle: new Unit(71.03, Unit.Type.INCHES),
    },
    hangars: {
        width: new Unit(128.75, Unit.Type.INCHES),
        height: new Unit(116, Unit.Type.INCHES),
    },
    balls: {
        degreeDifference,
        radiusFromCenter: new Unit(153.00, Unit.Type.INCHES),
        points: [
            new Angle(degreeDifference, Angle.Degrees),
            new Angle(degreeDifference * 2, Angle.Degrees),
            new Angle(-degreeDifference, Angle.Degrees),
            new Angle(-degreeDifference * 2, Angle.Degrees),

            new Angle(90 + degreeDifference, Angle.Degrees),
            new Angle(90 - degreeDifference, Angle.Degrees),

            new Angle(180 + degreeDifference, Angle.Degrees),
            new Angle(180 + 2*degreeDifference, Angle.Degrees),
            new Angle(180 - degreeDifference, Angle.Degrees),
            new Angle(180 - 2*degreeDifference, Angle.Degrees),

            new Angle(270 - degreeDifference, Angle.Degrees),
            new Angle(270 + degreeDifference, Angle.Degrees),
        ],
        size: new Unit(9.5, Unit.Type.INCHES)
    },
    hubs: {
        radius: new Unit(118.66 - 84.75, Unit.Type.INCHES),
        /*
        |-**-|
        |    |
        |    |
        |    |
        |    |
        |----|
        */
        spitters: {
            width: new Unit(14.75, Unit.Type.INCHES),
            height: new Unit(-10 + Math.sqrt(Math.pow(118.66 - 84.75, 2) + Math.pow(118.66 - 84.75, 2)) + (75.07 / 2), Unit.Type.INCHES),
            draw(ctx, angle=new Angle(30, Angle.Degrees), start={x: 0, y: 0}, i2p=inchToPixel) {
                ctx.save();
                ctx.translate(start.x, start.y);
                ctx.rotate(angle.get(Angle.Radians));
                ctx.beginPath();
                ctx.lineTo(-this.width.getcu(i2p, Unit.Type.INCHES) / 2, 0);
                ctx.lineTo(-this.width.getcu(i2p, Unit.Type.INCHES) / 2, this.height.getcu(i2p, Unit.Type.INCHES));
                ctx.lineTo(this.width.getcu(i2p, Unit.Type.INCHES) / 2, this.height.getcu(i2p, Unit.Type.INCHES));
                ctx.lineTo(this.width.getcu(i2p, Unit.Type.INCHES) / 2, 0);
                ctx.lineTo(0, 0);
                ctx.fill();
                ctx.restore();
            },
            getPositions(angle=new Angle(30, Angle.Degrees), start={x: 0, y: 0}, i2p=inchToPixel) {
                let positions = {
                    topLeft: {
                        x: -this.width.getcu(i2p, Unit.Type.INCHES) / 2, 
                        y: 0
                    }, 
                    bottomLeft: {
                        x: -this.width.getcu(i2p, Unit.Type.INCHES) / 2, 
                        y: this.height.getcu(i2p, Unit.Type.INCHES)
                    }, 
                    bottomRight: {
                        x: this.width.getcu(i2p, Unit.Type.INCHES) / 2, 
                        y: this.height.getcu(i2p, Unit.Type.INCHES),
                    }, 
                    topRight: {
                        x: this.width.getcu(i2p, Unit.Type.INCHES) / 2,
                        y: 0
                    }
                };

                for (let key of Object.keys(positions)) {
                    positions[key] = {
                        x: (positions[key].x * Math.cos(angle.get(Angle.Radians)) - positions[key].y * Math.sin(angle.get(Angle.Radians))) + start.x,
                        y: (positions[key].x * Math.sin(angle.get(Angle.Radians)) + positions[key].y * Math.cos(angle.get(Angle.Radians))) + start.y
                    }
                }

                return positions;
            }
        }
    }
}

const inchToPixel = Object.keys(global).includes("custom_inchtopixel") ? global.custom_inchtopixel : 1; //Every x inches in x pixels
//to convert inches to pixels, multiply by inchToPixel

class Field extends React.Component {
    static SimulType = {
        Field: "field",
        Planning: "planning",
        AI: "ai_simul"
    }
    static PointType = {
        Hard: "hardpoint",
        Soft: "softpoint",
    }
    static TimelineEvent = {
        GeneralTime: "general_time",
        Drive: "drive",
        Wait: "wait",
        Rotate: "rotate",
        Shoot: "shoot",
    }
    constructor(props) {
        super(props);

        const i2p = props.inchToPixel || inchToPixel;

        const simulationType = props.simtype || Field.SimulType.Field;

        //Create balls
        let balls = [];
        const ballRadius = rapidReact.balls.radiusFromCenter.getcu(i2p, Unit.Type.INCHES);

        let i = 0;
        global.physObjs = [];
        const launchPadStart = new Angle(-66.5, Angle.Degrees).get(Angle.Radians) + Math.PI / 2; //+-3.00° btw
        for (let ballPoint of rapidReact.balls.points) {
            let ballPos = {
                x: ballRadius * Math.sin(ballPoint.get(Angle.Radians) + launchPadStart) + rapidReact.field.width.halfMeasure.getcu(i2p, Unit.Type.INCHES),
                y: ballRadius * Math.cos(ballPoint.get(Angle.Radians) + launchPadStart) + rapidReact.field.height.halfMeasure.getcu(i2p, Unit.Type.INCHES)
            }

            balls.push(new Ball(
                ballPos.x,
                ballPos.y,
                i % 2 == 0 ? "red" : "blue",
                rapidReact.balls.size.getcu(i2p, Unit.Type.INCHES) / 2
            ));
            i++;
        }
        
        //Create physical objects for the field
        let physicalObjects = [];

        const launchPadStart2 = new Angle(-68.5, Angle.Degrees).get(Angle.Radians); //+-3.00° btw
        for (let i = 0; i < Math.PI; i += Math.PI / 2) {
            //Spitters
            const adjustment = Math.PI / 4 + new Angle(0, Angle.Degrees).get(Angle.Radians);
            // rapidReact.hubs.spitters.getPositions(new Angle(i + launchPadStart2 + adjustment, Angle.Radians), {
            //     x: 0 * Math.sin(i + launchPadStart2 + adjustment) + rapidReact.field.width.halfMeasure.getcu(inchToPixel, Unit.Type.INCHES),
            //     y: 0 * Math.cos(i + launchPadStart2 + adjustment) + rapidReact.field.height.halfMeasure.getcu(inchToPixel, Unit.Type.INCHES)
            // });

            physicalObjects.push(new Physical({
                x: 0 * Math.sin(i + launchPadStart2 + adjustment) + rapidReact.field.width.halfMeasure.getcu(i2p, Unit.Type.INCHES),
                y: 0 * Math.cos(i + launchPadStart2 + adjustment) + rapidReact.field.height.halfMeasure.getcu(i2p, Unit.Type.INCHES)
            }, Physical.Type.RECTANGLE, {
                w: rapidReact.hubs.spitters.width.getcu(i2p, Unit.Type.INCHES),
                h: rapidReact.hubs.spitters.height.getcu(i2p, Unit.Type.INCHES) * 2
            }, new Angle(i + launchPadStart2 + adjustment, Angle.Radians)));
        }

        //Walls
        physicalObjects.push(new Physical({
            x: -51,
            y: rapidReact.field.height.halfMeasure.getcu(i2p, Unit.Type.INCHES)
        }, Physical.Type.RECTANGLE, {
            w: 100,
            h: rapidReact.field.height.fullMeasure.getcu(i2p, Unit.Type.INCHES)
        }, new Angle(0, Angle.Radians)));

        physicalObjects.push(new Physical({
            x: rapidReact.field.width.halfMeasure.getcu(i2p, Unit.Type.INCHES),
            y: -51
        }, Physical.Type.RECTANGLE, {
            w: rapidReact.field.width.fullMeasure.getcu(i2p, Unit.Type.INCHES),
            h: 100
        }, new Angle(0, Angle.Radians)));

        physicalObjects.push(new Physical({
            x: rapidReact.field.width.halfMeasure.getcu(i2p, Unit.Type.INCHES),
            y: rapidReact.field.height.fullMeasure.getcu(i2p, Unit.Type.INCHES) + 51
        }, Physical.Type.RECTANGLE, {
            w: rapidReact.field.width.fullMeasure.getcu(i2p, Unit.Type.INCHES),
            h: 100
        }, new Angle(0, Angle.Radians)));

        physicalObjects.push(new Physical({
            x: rapidReact.field.width.fullMeasure.getcu(i2p, Unit.Type.INCHES) + 51,
            y: rapidReact.field.height.halfMeasure.getcu(i2p, Unit.Type.INCHES)
        }, Physical.Type.RECTANGLE, {
            w: 100,
            h: rapidReact.field.height.fullMeasure.getcu(i2p, Unit.Type.INCHES)
        }, new Angle(0, Angle.Radians)));

        //Clear physical objects if in planning mode
        if (simulationType == Field.SimulType.Planning) {
            physicalObjects = [];
        }

        //For testing
        console.log(physicalObjects)

        let planning = {};

        //Save to state
        this.state = {
            rapidReact: {
                scores: {
                    blue: 0,
                    red: 0,
                },
                balls,
                physicalObjects,
                mouseBall: new Ball(0, 0, "black", rapidReact.balls.size.getcu(i2p, Unit.Type.INCHES) / 2),
            },
            aprilTags: {
                //Add in AprilTag storage in window.localStorage or something else.
                tags: [
                    {
                        x: 0,
                        y: 0,
                        rotation: new Angle(0),
                        id: 0x00000001,
                    },
                    {
                        x: 0,
                        y: 0,
                        rotation: new Angle(0),
                        id: 0x00000002,
                    },
                    {
                        x: 0,
                        y: 0,
                        rotation: new Angle(0),
                        id: 0x00000003,
                    },
                    {
                        x: 0,
                        y: 0,
                        rotation: new Angle(0),
                        id: 0x00000004,
                    }
                ],
                editTagRotationTimestamp: Date.now(),
                ableToEdit: true,
                mouseInfo: {
                    indexHeld: -1,
                    offset: {
                        x: 0,
                        y: 0
                    }
                }
            },
            robotDimensions: {
                width: new Unit(36, Unit.Type.INCHES),
                length: new Unit(36, Unit.Type.INCHES),
                draw(ctx, x, y, rotation) {
                    const width = this.width.getcu(i2p, Unit.Type.INCHES);
                    const length = this.length.getcu(i2p, Unit.Type.INCHES);
                    const topLeftCorner = {
                        x: -width / 2,
                        y: -length / 2
                    }
                    const bottomRightCorner = {
                        x: width / 2,
                        y: length / 2
                    }
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.rotate(rotation.get(Angle.Radians));
                    ctx.beginPath();
                    ctx.lineTo(topLeftCorner.x, topLeftCorner.y);
                    ctx.lineTo(topLeftCorner.x, bottomRightCorner.y);
                    ctx.lineTo(bottomRightCorner.x, bottomRightCorner.y);
                    ctx.lineTo(bottomRightCorner.x, topLeftCorner.y);
                    ctx.lineTo(topLeftCorner.x, topLeftCorner.y);
                    ctx.fillStyle = "#000000";
                    ctx.fill();
                    ctx.strokeStyle = "#ffffff";
                    ctx.stroke();
                    ctx.restore();
                    ctx.strokeStyle = "#000000";
                }
            },
            i2p,
            simulationType,
            keyListeners: [],
            keysDown: {},

            //Path Planning
            planner: new PathPlanner(i2p, {}, [], [
                {
                    type: FieldTypes.Timeline.GeneralTime,
                    start: 0,
                    end: rapidReact.autonomousLength,
                    name: "Autonomous",
                },
                {
                    type: FieldTypes.Timeline.Drive,
                    start: 0,
                    end: 5,
                    name: "Move"
                },
                {
                    type: FieldTypes.Timeline.Rotate,
                    start: 0,
                    end: 0.1,
                    name: "15°"
                }
            ]),

            positions: [],
            mousePickedUp: -1,

            show: {
                generatedPath: true,
                pathPoints: true,
                pathAsPoints: false,
                timeline: false
            },

            timeline: new TimelinePlanner(rapidReact.autonomousLength),

            generatedPath: [],

            playback: {
                playing: false,
                start: Date.now(),
                pause: Date.now(),
                accumPause: 0,
                getTimePlaying() {
                    return this.playing ? Date.now() - this.start - this.accumPause : this.pause - this.start - this.accumPause;
                },

                robot: {
                    x: 0,
                    y: 0
                }
            },

            planningMenu: false,
            planningMenuJustOpened: false,
            planningMenuPos: {
                x: 0,
                y: 0
            },
            planningMenuOptions: [
                {
                    name: "Create Hard Point",
                    action: (x, y) => {
                        this.state.planner.addPosition({
                            x,
                            y,
                            type: Field.PointType.Hard
                        });
                    },
                    renderCondition() {
                        return true;
                    }
                },
                {
                    name: 'Create Soft Point',
                    action: (x, y) => {
                        this.state.planner.addPosition({
                            x,
                            y,
                            type: Field.PointType.Soft
                        });
                    },
                    renderCondition: () => {
                        return this.state.planner.getPositions().length > 0;
                    }
                },
                {
                    name: 'Hide Points',
                    action: () => {
                        this.state.show.pathPoints = false;
                    },
                    renderCondition: () => {
                        return this.state.show.pathPoints;
                    }
                },
                {
                    name: 'Show Points',
                    action: () => {
                        this.state.show.pathPoints = true;
                    },
                    renderCondition: () => {
                        return !this.state.show.pathPoints;
                    }
                },
                {
                    name: 'Hide Generated Path',
                    action: () => {
                        this.state.show.generatedPath = false;
                    },
                    renderCondition: () => {
                        return this.state.show.generatedPath;
                    }
                },
                {
                    name: 'Show Generated Path',
                    action: () => {
                        this.state.show.generatedPath = true;
                    },
                    renderCondition: () => {
                        return !this.state.show.generatedPath;
                    }
                },
            ],
        }

        if (simulationType == Field.SimulType.Planning) { 
            //TODO: Add this in when releasing
            // window.onbeforeunload = () => {
            //     return this.state.positions > 0;
            // };

            this.state.keyListeners.push(this.state.timeline);

            window.downloadPath = () => {
                let path = this.state.planner.getPositions();
                let pathString = JSON.stringify(path);
                let blob = new Blob([pathString], {type: "application/json"});
                let url = URL.createObjectURL(blob);
                let a = document.createElement('a');
                a.download = "path.json";
                a.href = url;
                a.click();
            }

            window.savePathLocal = (pathName="default") => {
                let path = this.state.planner.getPositions();
                if (path.length == 0) {
                    console.warn("Cannot save a path that has 0 points.");
                    return;
                }
                let pathString = JSON.stringify(path);
                localStorage.setItem(pathName, pathString);
            }

            window.loadPathLocal = (pathName="default") => {
                let pathString = localStorage.getItem(pathName);
                let path = JSON.parse(pathString);
                this.state.planner.updatePositions(path);
                this.state.generatedPath = this.state.planner.generateBezierCurve({
                    distBetweenPoints: baseDistanceBetweenPoints
                });
                this.setState({
                    positions: path,
                    generatedPath: this.state.planner.generateBezierCurve({
                        distBetweenPoints: baseDistanceBetweenPoints
                    })
                });
            }
        }
    }

    togglePlanningMenu(open=!this.state.planningMenu) {
        this.setState({
            planningMenu: open,
            planningMenuJustOpened: true
        })
        this.state.planningMenu = open;
        this.state.planningMenuJustOpened = true;
    }

    rapidReact(ctx, frameCount, rel, canvas, mouse) {
        const width = canvas.width;
        const height = canvas.height;
        const i2p = this.state.i2p;

        ctx.fillStyle = "gray";
        ctx.fillRect(0, 0, width, height);

        //Draw Terminals
        ctx.fillStyle = "#404040";
        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(0, height - rapidReact.terminals.missingFromWalls.getcu(i2p, Unit.Type.INCHES));
        ctx.lineTo(rapidReact.terminals.missingFromWalls.getcu(i2p, Unit.Type.INCHES), height);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(width, 0)
        ctx.lineTo(width - rapidReact.terminals.missingFromWalls.getcu(i2p, Unit.Type.INCHES), 0);
        ctx.lineTo(width, rapidReact.terminals.missingFromWalls.getcu(i2p, Unit.Type.INCHES));
        ctx.fill();

        //Center hub
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.arc(
            rapidReact.field.width.halfMeasure.getcu(i2p, Unit.Type.INCHES), 
            rapidReact.field.height.halfMeasure.getcu(i2p, Unit.Type.INCHES), 
            rapidReact.hubs.radius.getcu(i2p, Unit.Type.INCHES), 0, 
            2 * Math.PI
        );
        ctx.stroke();

        
        //Launch pads + spitters
        let indx = 0;
        const launchPadStart = new Angle(-68.5, Angle.Degrees).get(Angle.Radians); //+-3.00° btw
        for (let i = 0; i < 2 * Math.PI; i += Math.PI / 2) {
            const r = 3 + rapidReact.launchPads.middleToStart.getcu(i2p, Unit.Type.INCHES);
            
            if (indx == 1 || indx == 2) {
                ctx.fillStyle = "blue";
            } else {
                ctx.fillStyle = "red";
            }

            rapidReact.launchPads.draw(ctx, new Angle(i + launchPadStart, Angle.Radians), {
                x: -r * Math.sin(i + launchPadStart) + rapidReact.field.width.halfMeasure.getcu(i2p, Unit.Type.INCHES), 
                y: r * Math.cos(i + launchPadStart) + rapidReact.field.height.halfMeasure.getcu(i2p, Unit.Type.INCHES)
            }, i2p);

            indx++;

            //Spitters
            ctx.fillStyle = "black";
            const adjustment = Math.PI / 4 + new Angle(0, Angle.Degrees).get(Angle.Radians);
            rapidReact.hubs.spitters.draw(ctx, new Angle(i + launchPadStart + adjustment, Angle.Radians), {
                x: 0 * Math.sin(i + launchPadStart + adjustment) + rapidReact.field.width.halfMeasure.getcu(i2p, Unit.Type.INCHES),
                y: 0 * Math.cos(i + launchPadStart + adjustment) + rapidReact.field.height.halfMeasure.getcu(i2p, Unit.Type.INCHES)
            }, i2p);
        }

        //middle line
        ctx.beginPath();
        ctx.moveTo(width / 2 - rapidReact.middleLine.pointToMiddle.getcu(i2p, Unit.Type.INCHES), 0);
        ctx.lineTo(width / 2 + rapidReact.middleLine.pointToMiddle.getcu(i2p, Unit.Type.INCHES), height);
        ctx.stroke();

        //hangars
        ctx.fillStyle = "blue";
        ctx.fillRect(0, 0, rapidReact.hangars.width.getcu(i2p, Unit.Type.INCHES), rapidReact.hangars.height.getcu(i2p, Unit.Type.INCHES));
        ctx.fillStyle = "red";
        ctx.fillRect(width - rapidReact.hangars.width.getcu(i2p, Unit.Type.INCHES), height - rapidReact.hangars.height.getcu(i2p, Unit.Type.INCHES), rapidReact.hangars.width.getcu(i2p, Unit.Type.INCHES), rapidReact.hangars.height.getcu(i2p, Unit.Type.INCHES));

        const lastMousePos = {
            x: this.state.rapidReact.mouseBall.pos.x,
            y: this.state.rapidReact.mouseBall.pos.y
        }

        //calculate velocity using mouse position and last mouse position
        const velocity = {
            x: mouse.x - lastMousePos.x,
            y: mouse.y - lastMousePos.y
        }

        //normalize velocity
        const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);

        //get direction between mouse and last mouse position
        const direction = Math.atan2(mouse.y - lastMousePos.y, mouse.x - lastMousePos.x);

        //check if position is inside a ball
        let insideBall = false;
        this.state.rapidReact.balls.forEach(ball => {
            if (Math.sqrt(Math.pow(ball.pos.x - mouse.x, 2) + Math.pow(ball.pos.y - mouse.y, 2)) < ball.size.r) {
                insideBall = true;
            }
        });

        if (this.state.simulationType == Field.SimulType.Field) {
            if (!insideBall) {
                this.state.rapidReact.mouseBall.pos.vel = magnitude;
                if (direction != 0) {
                    this.state.rapidReact.mouseBall.pos.dir = direction;
                }
                this.state.rapidReact.mouseBall.pos.x = mouse.x;
                this.state.rapidReact.mouseBall.pos.y = mouse.y;
                this.state.rapidReact.mouseBall.move(true);
            } else {
                this.state.rapidReact.mouseBall.pos.vel = 0;
            }
        }
        

        //balls
        for (let ball of this.state.rapidReact.balls) {
            ball.draw(ctx);
            if (this.state.simulationType == Field.SimulType.Field) ball.move();
        }

        ctx.fillStyle = "white";

        if (this.state.simulationType == Field.SimulType.Field) {
            for (let physObj of this.state.rapidReact.physicalObjects) {
                physObj.draw(ctx);
                if (physObj.type == Physical.Type.CIRCLE) continue;
                if (physObj.checkCollision(this.state.rapidReact.mouseBall)) {
                    ctx.fillStyle = "white";
                    ctx.font = "20px Arial";
                    let side = physObj.checkCollision(this.state.rapidReact.mouseBall, true);
                    const angleOfWall = physObj.angleOfWall(side.between > 0 ? 1 : 0);
                    const angleOfBall = Angle.normalize(new Angle(this.state.rapidReact.mouseBall.pos.dir, Angle.Radians));
                    let lowerBound = angleOfWall.get(Angle.Radians);
                    let upperBound = Math.PI + angleOfWall.get(Angle.Radians);

                    let bottom = angleOfBall.get(Angle.Radians) > lowerBound && angleOfBall.get(Angle.Radians) < upperBound;
                    ctx.fillText("Collision " + side.between + ", " + angleOfBall.get(Angle.Radians) + "," + bottom + ", " + (Math.floor(lowerBound * 100) / 100) + ', ' + (Math.floor(upperBound * 100) / 100), 10, 50 + physObj.rotation.get(Angle.Degrees));
                    ctx.fillStyle = "white";
                } 
                // 
                // ctx.fillRect(physObj.pos.x, physObj.pos.y, 10, 10);
            }
        }

        this.generalDraw(ctx, frameCount, rel, canvas, mouse)

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, this.state.simulationType == Field.SimulType.Field ? 5 : 2, 0, 2 * Math.PI);
        ctx.fill();
        
        //write mouse pos
        ctx.fillStyle = "black";
        ctx.font = "20px Arial";
        ctx.fillText(`x: ${mouse.x}, y: ${mouse.y}`, 10, 20);
    }
    generalDraw(ctx, frameCount, rel, canvas, mouse) {
        const i2p = this.state.i2p;
    
        let index = 0;
        //draw april tags
        for (let tag of this.state.aprilTags.tags) {
            ctx.beginPath();
            ctx.arc(tag.x, tag.y, 10, 0, 2 * Math.PI);
            ctx.stroke();

            const width = new Unit(8, Unit.Type.INCHES).getcu(i2p, Unit.Type.INCHES);
            const height = 3;

            ctx.save();
            ctx.translate(tag.x, tag.y);
            ctx.rotate(tag.rotation.get(Angle.Radians));
            ctx.beginPath();
            ctx.lineTo(width / -2, height / 2);
            ctx.lineTo(width / -2, -height / 2);
            ctx.lineTo(width / 2, -height / 2);
            ctx.lineTo(width / 2, height / 2);
            ctx.lineTo(width / -2, height / 2);
            ctx.lineTo(-1, height / 2);
            ctx.lineTo(-1, 20);
            ctx.lineTo(1, 20);
            ctx.lineTo(1, height / 2);
            ctx.stroke();
            ctx.restore();

            if (this.state.aprilTags.mouseInfo.indexHeld < 0 && dist(tag.x, tag.y, mouse.x, mouse.y) < 10) {
                ctx.fillStyle = "white";
                ctx.font = "20px Arial";
                ctx.fillText("Tag " + tag.id, 10, 50);
                ctx.fillStyle = "white";

                if (!mouse.down && (this.state.keysDown ? this.state.keysDown["e"] : false) && this.state.aprilTags.editTagRotationTimestamp < Date.now() - 200) {
                    if (this.state.aprilTags.ableToEdit) {
                        this.state.aprilTags.editTagRotationTimestamp = Date.now();
                        const newAngle = prompt(`Enter new angle for tag ${tag.id} in degrees (current degrees: ${tag.rotation.get(Angle.Degrees)})`);
                        if (newAngle != null) {
                            tag.rotation = new Angle(parseFloat(newAngle) || 0, Angle.Degrees);
                        }
                        delete this.state.keysDown["e"];
                        this.state.aprilTags.editTagRotationTimestamp = Date.now();
                        this.state.aprilTags.ableToEdit = false;
                    } else {
                        this.state.aprilTags.ableToEdit = true;
                        delete this.state.keysDown["e"];
                    }
                }
            }

            if (mouse.down && dist(tag.x, tag.y, mouse.x, mouse.y) < 10 && this.state.aprilTags.mouseInfo.indexHeld < 0) {
                this.state.aprilTags.mouseInfo.indexHeld = index;
                this.state.aprilTags.mouseInfo.offset.x = tag.x - mouse.x;
                this.state.aprilTags.mouseInfo.offset.y = tag.y - mouse.y;
            }
            index++;
        }

        if (this.state.aprilTags.mouseInfo.indexHeld >= 0) {
            if (!mouse.down || !(mouse.inCanvas)) {
                this.state.aprilTags.mouseInfo.indexHeld = -1;
            } else {
                this.state.aprilTags.tags[this.state.aprilTags.mouseInfo.indexHeld].x = mouse.x + this.state.aprilTags.mouseInfo.offset.x;
                this.state.aprilTags.tags[this.state.aprilTags.mouseInfo.indexHeld].y = mouse.y + this.state.aprilTags.mouseInfo.offset.y;
            }
        }

        if (this.state.simulationType == Field.SimulType.Planning) {

            //--Path Points--

            //Check if point is being picked up
            for (let i = 0; i < this.state.planner.getPositions().length; i++) {
                if (!this.state.planningMenu && mouse.down) {
                    if (this.state.mousePickedUp < 0) {
                        const dist = Math.sqrt(Math.pow(this.state.planner.getPositions()[i].x - mouse.x, 2) + Math.pow(this.state.planner.getPositions()[i].y - mouse.y, 2));
                        if (dist < ((i == 0 || i == this.state.planner.getPositions().length - 1) && this.state.planner.getPositions().length > 1 ? 10 : 5)) {
                            this.state.mousePickedUp = i;
                        }
                    }
                }
            }

            if (this.state.mousePickedUp >= 0) {
                const height = rapidReact.field.height.fullMeasure.getcu(i2p, Unit.Type.INCHES);

                if (!mouse.down) {
                    const currentPickedPos = this.state.planner.getPositions()[this.state.mousePickedUp];
                    if (currentPickedPos.x > 10 && 
                        currentPickedPos.x < height * 0.1 && 
                        currentPickedPos.y > height - (height * 0.1) - 10 && 
                        currentPickedPos.y < height - 10
                        ) {
                        this.state.planner.getPositions().splice(this.state.mousePickedUp, 1);

                        if (this.state.planner.getPositions().length == 1 && this.state.planner.getPositions()[0].type == Field.PointType.Soft) {
                            this.state.planner.getPositions()[0].type = Field.PointType.Hard;
                        }
                    }

                    this.state.mousePickedUp = -1;

                    this.state.generatedPath = this.state.planner.generateBezierCurve({
                        distBetweenPoints: baseDistanceBetweenPoints
                    });
                    //console.log(this.state.planner.generateBezierCurve.bind(this)())
                } else {
                    ctx.fillStyle = "red";
                    ctx.fillRect(10, height - (height * 0.1) - 10, height * 0.1, height * 0.1);

                    this.state.planner.getPositions()[this.state.mousePickedUp].x = mouse.x;
                    this.state.planner.getPositions()[this.state.mousePickedUp].y = mouse.y;
                }
            }

            //Draw points
            if (this.state.show.pathPoints) {
                for (let i = 0; i < this.state.planner.getPositions().length; i++) {
                    const point = this.state.planner.getPositions()[i];

                    if ((i == this.state.planner.getPositions().length - 1 || i == 0) && this.state.planner.getPositions().length > 1) {
                        ctx.fillStyle = i == 0 ? "#c908c3" : "#c9e800";
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
                        ctx.fill();
                    }

                    ctx.fillStyle = point.type == Field.PointType.Hard ? "#ebae07" : "#07eb4f";
                    if (i == this.state.mousePickedUp) {
                        ctx.fillStyle = "#dd28ed";
                    }
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
                    ctx.fill();

                    if (i > 0) {
                        const previousPoint = this.state.planner.getPositions()[i - 1];
                        ctx.strokeStyle = "#26ebe1";
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.moveTo(previousPoint.x, previousPoint.y);
                        ctx.lineTo(point.x, point.y);
                        ctx.stroke();
                        ctx.strokeStyle = "black";
                        ctx.lineWidth = 1;
                    }
                }
            }

            //Draw generated path if nothing is being moved around
            if (this.state.mousePickedUp == -1 && this.state.show.generatedPath) {
                ctx.strokeStyle = "#7b00ff";
                ctx.lineWidth = 3;
                for (let i = 0; i < this.state.generatedPath.length; i++) {
                    const path = this.state.generatedPath[i];
                    if (path.length == 0) continue;
                    if (!this.state.show.pathAsPoints) {
                        ctx.beginPath();
                        ctx.moveTo(path[0].x, path[0].y)
                        for (let j = 0; j < path.length; j++) {
                            if (j == 0) continue;
                            ctx.lineTo(path[j].x, path[j].y)
                        }
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = "#7b00ff";
                        for (let j = 0; j < path.length; j++) {
                            if (j == 0) continue;
                            ctx.beginPath();
                            ctx.arc(path[j].x, path[j].y, 3, 0, 2 * Math.PI);
                            ctx.fill();
                        }
                    }
                }

                ctx.strokeStyle = "black";
                ctx.lineWidth = 1;

                if (this.state.playback.getTimePlaying() > 0) {
                    const getDuration = this.state.timeline.getDuration;

                    const genTimeline = this.state.timeline.getEvents().filter(e => e.type == FieldTypes.Timeline.GeneralTime)[0];

                    //Stop playback from going over the max time
                    const maxTime = getDuration(genTimeline) * 1000;
                    if (this.state.playback.getTimePlaying() >= maxTime) {
                        this.state.playback.playing = false;
                        console.log(this.state.playback.getTimePlaying())
                        const differenceAtEnd = this.state.playback.getTimePlaying() - maxTime;
                        this.state.playback.accumPause -= differenceAtEnd;
                        console.log(this.state.playback.getTimePlaying())
                    }

                    const trajPath = this.state.timeline.generated;
                    
                    const indexInGeneratedTrajectory = Math.floor(this.state.playback.getTimePlaying() / (pathDeltaTime * 1000));
                    if (indexInGeneratedTrajectory < trajPath.length) {
                        const currentPos = {
                            x: trajPath[indexInGeneratedTrajectory][0].data.position.x,
                            y: trajPath[indexInGeneratedTrajectory][0].data.position.y
                        }

                        //window["__currentPos"] = { currentPos, indexInGeneratedTrajectory, p: trajPath[indexInGeneratedTrajectory] };

                        ctx.fillStyle = "#ff0000";
                        ctx.beginPath();
                        ctx.arc(currentPos.x, currentPos.y, 10, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.stroke();

                        let angle = 0;
                        if (indexInGeneratedTrajectory < trajPath.length - 1) {
                            const nextPos = {
                                x: trajPath[indexInGeneratedTrajectory + 1][0].data.position.x,
                                y: trajPath[indexInGeneratedTrajectory + 1][0].data.position.y
                            }
                            angle = Math.atan2(nextPos.y - currentPos.y, nextPos.x - currentPos.x);
                        } else {
                            const prevPos = {
                                x: trajPath[indexInGeneratedTrajectory - 1][0].data.position.x,
                                y: trajPath[indexInGeneratedTrajectory - 1][0].data.position.y
                            }
                            angle = Math.atan2(currentPos.y - prevPos.y, currentPos.x - prevPos.x);
                        }

                        this.state.robotDimensions.draw(ctx, currentPos.x, currentPos.y, new Angle(angle, Angle.Radians));

                        ctx.strokeStyle = "rgb(220, 40, 187)";
                        ctx.lineWidth = 2;

                        this.state.aprilTags.tags.forEach(tag => {
                            ctx.beginPath();
                            ctx.moveTo(tag.x, tag.y)
                            ctx.lineTo(currentPos.x, currentPos.y)
                            ctx.stroke();
                        })

                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "black";
                    }
                }
            }

            //--Timeline--

            //update timeline planner with how long it's been playing for
            this.state.timeline.updateTimePlayed(this.state.playback.getTimePlaying());

            if (this.state.show.timeline) {
                this.state.timeline.draw(ctx, frameCount, rel, canvas, mouse)
            }

            for (let trajPathPoint of (this.state.planner.getGeneratedPIDTrajectory() || [])) {
                ctx.fillStyle = Object.keys(trajPathPoint).includes("hard") ? "red" : "green";

                ctx.beginPath();
                ctx.arc(trajPathPoint.x, trajPathPoint.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            }

            //Timeline menu/Planning menu
            if (this.state.planningMenuJustOpened) {
                this.setState({
                    planningMenuPos: {
                        x: mouse.x,
                        y: mouse.y
                    },
                    planningMenuJustOpened: false
                });
                this.state.planningMenuPos = {
                    x: mouse.x,
                    y: mouse.y
                }
                this.state.planningMenuJustOpened = false;
            }

            if (this.state.planningMenu) {
                const pmPos = this.state.planningMenuPos;
                ctx.fillStyle = "#dd28ed";
                ctx.beginPath();
                ctx.arc(pmPos.x, pmPos.y, 5, 0, 2 * Math.PI);
                ctx.fill();

                const options = this.state.planningMenuOptions.filter(option => option.renderCondition())

                ctx.fillStyle = "#383838";
                ctx.fillRect(pmPos.x, pmPos.y, 200, options.length * 30 + 5);

                for (let i = 0; i < options.length; i++) {
                    let inBox = mouse.x > pmPos.x && mouse.x < pmPos.x + 200 && mouse.y > pmPos.y + i * 30 && mouse.y < pmPos.y + i * 30 + 30;
                    ctx.fillStyle = inBox ? "#787878" : "#575757";
                    ctx.fillRect(pmPos.x + 5, pmPos.y + i * 30 + 5, 190, 25);
                    ctx.fillStyle = "white";
                    ctx.font = "15px Arial";
                    ctx.fillText(`${options[i].name}`, pmPos.x + 10, pmPos.y + i * 30 + 22);

                    if (inBox && mouse.down) {
                        options[i].action(pmPos.x, pmPos.y);
                        this.togglePlanningMenu();

                        this.state.generatedPath = this.state.planner.generateBezierCurve({
                            distBetweenPoints: baseDistanceBetweenPoints
                        });
                    }
                }
            }
        }
    }
    keyDown(e) {
        const lk = e.key.toLowerCase();

        const sk = () => {
            let currentKeyDown = Object.assign({}, this.state.keysDown);
            currentKeyDown[lk] = true;
            this.setState({
                keysDown: currentKeyDown
            });
            this.state.keysDown = currentKeyDown

            this.state.keyListeners.forEach(listener => {listener.updateKeysDown(this.state.keysDown)});
        }

        if ((e.key == "a" || e.key == "A") && !this.state.keysDown[lk]) { //open planning menu
            this.togglePlanningMenu();
        } else if (lk == "s" && !this.state.keysDown[lk]) { //save path
            let savePrompt = prompt("Save as: ");
            if (savePrompt != null) {
                window.savePathLocal(savePrompt)
            }
        } else if (lk == "l" && !this.state.keysDown[lk]) { //load in path
            let loadPrompt = prompt("Load: ");
            if (loadPrompt != null) {
                window.loadPathLocal(loadPrompt)
            }
        } else if (lk == "arrowright" && !this.state.keysDown[lk]) { //go frame forward in playback
            this.state.playback.accumPause -= 100;
            if (this.state.playback.getTimePlaying() < 0) {
                this.state.playback.accumPause += Math.abs(this.state.playback.getTimePlaying());
            }
            //this.state.playback.t = Math.min(this.state.playback.t, this.state.playback.maxT);
        } else if (lk == "arrowleft" && !this.state.keysDown[lk]) { //go frame back in playback
            this.state.playback.accumPause += 100;
            const maxTime = this.state.timeline.events.filter(event => event.type == Field.TimelineEvent.GeneralTime)[0].end * 1000;
            if (this.state.playback.getTimePlaying() > maxTime) {
                this.state.playback.accumPause -= (Math.abs(this.state.playback.getTimePlaying()) - maxTime);
            }
        } else if (lk == " " && !this.state.keysDown[lk]) { //play/pause playback
            if (this.state.generatedPath.length > 0) {
                this.state.playback.playing = !this.state.playback.playing;

                if (!this.state.playback.playing) {
                    this.state.playback.pause = Date.now();
                } else {
                    this.state.playback.accumPause += Date.now() - this.state.playback.pause;
                    this.state.playback.pause = 0;
                }

                //console.log(`Duration: ${this.state.playback.getTimePlaying()}ms, playing: ${this.state.playback.playing}`);
            }
        } else if (lk == "k" && !this.state.keysDown[lk]) { //reset playback 
            this.state.playback.start = 0;
            this.state.playback.pause = 0;
            this.state.playback.accumPause = 0;
            if (this.state.playback.playing) {
                this.state.playback.start = Date.now();
            }
        } else if (lk == "i" && !this.state.keysDown[lk]) {
            this.state.show.pathAsPoints = !this.state.show.pathAsPoints;
        } else if (lk == "t" && !this.state.keysDown[lk]) {
            this.state.show.timeline = !this.state.show.timeline;
        } else if (lk == "g" && !this.state.keysDown[lk]) {
            this.state.planner.generatePath(this.state.planner.getPositions()[0], -1, false);
        } else if (lk == "h" && !this.state.keysDown[lk]) {
            const newTimeline = this.state.planner.generateTimeline([], 0);
            this.state.timeline.generated = newTimeline;
        }

        sk();
    }
    keyUp(e) {
        const lk = e.key.toLowerCase();
        if (Object.keys(this.state.keysDown).includes(lk)) {
            let currentKeyDown = Object.assign({}, this.state.keysDown);
            delete currentKeyDown[lk];
            this.setState({
                keysDown: currentKeyDown
            });
            this.state.keysDown = currentKeyDown;

            this.state.keyListeners.forEach(listener => {listener.updateKeysDown(this.state.keysDown)});
        }
    }
    defaultKeyDown(e) {
        const lk = e.key.toLowerCase();

        const sk = () => {
            let currentKeyDown = Object.assign({}, this.state.keysDown);
            currentKeyDown[lk] = true;
            this.setState({
                keysDown: currentKeyDown
            });
            this.state.keysDown = currentKeyDown
        }
        
        sk();
    }
    componentDidMount() {
        if (this.state.simulationType == Field.SimulType.Planning) {
            //Add listeners to keys for planning
            window.addEventListener("keydown", this.keyDown.bind(this))
        } else window.addEventListener("keydown", this.defaultKeyDown.bind(this))

        //Just remove any keys that are down
        window.addEventListener("keyup",this.keyUp.bind(this))
    }
    componentWillUnmount() {
        if (this.state.simulationType == Field.SimulType.Planning) {
            //Remove listeners to keys for planning
            window.removeEventListener("keydown", this.keyDown.bind(this))
        } else window.removeEventListener("keydown", this.defaultKeyDown.bind(this))

        //Just remove any keys that are down
        window.removeEventListener("keyup",this.keyUp.bind(this))
    }
    render() {
        const i2p = this.state.i2p;

        let game = rapidReact;

        if (Object.keys(this.props || {}).includes("game")) {
            switch (this.params.game) {
                case "rapidReact":
                    game = rapidReact;
                    break;
                default:
                    game = rapidReact;
            }
        }

        return (
            <div id="field-parent">
                <Mover target="field-parent"></Mover>
                <Canvas id="field" 
                    width={game.field.width.fullMeasure.getcu(i2p, Unit.Type.INCHES)} 
                    height={game.field.height.fullMeasure.getcu(i2p, Unit.Type.INCHES)} 
                    draw={this.rapidReact.bind(this)}
                ></Canvas>
            </div>
        )
    }
}

export default Field;

const FieldTypes = {
    Points: Field.PointType,
    Simulation: Field.SimulType,
    Timeline: Field.TimelineEvent
}

export { Field, FieldTypes }