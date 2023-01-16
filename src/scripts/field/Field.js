import React from "react";
import Canvas from "../canvas/Canvas";
import {Unit,Angle} from "../misc/unit"
import Mover from "../mover/Mover";

import { Ball, Physical } from "./PlayObj";

import PathPlanner from "./pathplanner/PathPlanner";
import TimelinePlanner from "./pathplanner/TimelinePlanner";
import AprilTagManager, { AprilTag } from "./apriltags/AprilTags";

import "./Field.css"
import dist from "../misc/dist";
import PositionEvent from "./pathplanner/PositionEvent";
import PlayerStartManager from "./interact/PlayerStart";

import { load, save } from "../save/SaveManager";
import RapidReactPlayer from "./interact/Player";
import probability, { random } from "../misc/probability";

const degreeDifference = 15;

const pathDeltaTime = 0.03125;

const baseDistanceBetweenPoints = 3;

const positionEventEditDistance = 10;

const maxAmountOfPlayers = 6;


const defaultAprilTagSize = new Unit(8, Unit.Type.INCHES);

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

const chargedUp = {
    autonomousLength: 15,
    field: {
        width: {
            halfMeasure: new Unit((54 * 12 + 3.5) / 2, Unit.Type.INCHES),
            fullMeasure: new Unit((54 * 12 + 3.5), Unit.Type.INCHES),
        },
        // 26 ft. 3½ in
        height: {
            halfMeasure: new Unit(((26 * 12) + 3.5) / 2, Unit.Type.INCHES),
            fullMeasure: new Unit((26 * 12) + 3.5, Unit.Type.INCHES),
        }
    },
    gamePieceStarts: {
        offsetFromCenter: new Unit(47.36, Unit.Type.INCHES),
        topOffset: new Unit(36.19, Unit.Type.INCHES),
        betweenSpace: new Unit(48, Unit.Type.INCHES),
        radius: new Unit(2, Unit.Type.INCHES),
        numberOfStartPositionsPerSide: 4,
        getYPoses: () => {
            const max_height = chargedUp.field.height.fullMeasure;
            const topOffset = chargedUp.gamePieceStarts.topOffset;
            const between = chargedUp.gamePieceStarts.betweenSpace;

            let startYPosition = max_height.get(Unit.Type.INCHES) - topOffset.get(Unit.Type.INCHES);

            let yPositions = [
                startYPosition,
                startYPosition - (between.get(Unit.Type.INCHES)),
                startYPosition - (2 * between.get(Unit.Type.INCHES)),
                startYPosition - (3 * between.get(Unit.Type.INCHES)),
            ];

            return yPositions;
        },
        blue: () => {
            //All measurements are made in inches in this calculation.
            const max_width = chargedUp.field.width.fullMeasure;
            const offset = chargedUp.gamePieceStarts.offsetFromCenter;
            
            const yPoses = chargedUp.gamePieceStarts.getYPoses();

            const xPos = (max_width.get(Unit.Type.INCHES) / 2) - offset.get(Unit.Type.INCHES);

            let positions = [];

            for (let i = 0; i < chargedUp.gamePieceStarts.numberOfStartPositionsPerSide; i++) {
                positions.push({
                    x: new Unit(xPos, Unit.Type.INCHES),
                    y: new Unit(yPoses[i], Unit.Type.INCHES)
                });
            }

            return positions;
        },
        red: () => {
            //All measurements are made in inches in this calculation.
            const max_width = chargedUp.field.width.fullMeasure;
            const offset = chargedUp.gamePieceStarts.offsetFromCenter;
            
            const yPoses = chargedUp.gamePieceStarts.getYPoses();

            const xPos = (max_width.get(Unit.Type.INCHES) / 2) + offset.get(Unit.Type.INCHES);

            let positions = [];

            for (let i = 0; i < chargedUp.gamePieceStarts.numberOfStartPositionsPerSide; i++) {
                positions.push({
                    x: new Unit(xPos, Unit.Type.INCHES),
                    y: new Unit(yPoses[i], Unit.Type.INCHES)
                });
            }

            return positions;
        }
    },
    grid: {
        depth: new Unit(54.05, Unit.Type.INCHES),
        length: new Unit(33 + 18.25 + 47.75 + 18.25 + 47.75 + 18.25 + 33.22, Unit.Type.INCHES),
        blueTopLeftPosition: () => {
            return {
                x: new Unit(0, Unit.Type.INCHES),
                y: new Unit(chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES) - chargedUp.grid.length.get(Unit.Type.INCHES), Unit.Type.INCHES)
            }
        },
        redTopLeftPosition: () => {
            return {
                x: new Unit(chargedUp.field.width.fullMeasure.get(Unit.Type.INCHES) - chargedUp.grid.depth.get(Unit.Type.INCHES), Unit.Type.INCHES),
                y: new Unit(chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES) - chargedUp.grid.length.get(Unit.Type.INCHES), Unit.Type.INCHES)
            }
        },
        rows: {
            topRowWidth: new Unit(54.05 - 31.59, Unit.Type.INCHES),
            middleRowWidth: new Unit(31.59 - 14.28, Unit.Type.INCHES),
            bottomRowWidth: new Unit(14.28, Unit.Type.INCHES),

            lengthOfBottomFieldConeSection: new Unit(33, Unit.Type.INCHES),
            lengthOfTopFieldConeSection: new Unit(33.22, Unit.Type.INCHES),
            lengthOfCubeSection: new Unit(18.25, Unit.Type.INCHES),
            lengthOfInnerConeSection: new Unit(47.75 / 2, Unit.Type.INCHES),

            getBlueDimensionsList: () => {
                let locations = {
                    top: [],
                    middle: [],
                    bottom: []
                }

                const generalTopRowX = chargedUp.grid.blueTopLeftPosition().x.get(Unit.Type.INCHES);
                const middleRowX = generalTopRowX + chargedUp.grid.rows.topRowWidth.get(Unit.Type.INCHES);
                const bottomRowX = middleRowX + chargedUp.grid.rows.middleRowWidth.get(Unit.Type.INCHES);

                const topRowWidth = chargedUp.grid.rows.topRowWidth.get(Unit.Type.INCHES);
                const middleRowWidth = chargedUp.grid.rows.middleRowWidth.get(Unit.Type.INCHES);
                const bottomRowWidth = chargedUp.grid.rows.bottomRowWidth.get(Unit.Type.INCHES);

                const colors = {
                    cone: {
                        coop: {
                            top: "#807e7e",
                            middle: "#696969",
                            bottom: "#616161",
                        },
                        outer: {
                            top: "#5a69f2",
                            middle: "#4152f0",
                            bottom: "#616161",
                        }
                        
                    },
                    cube: {
                        top: "#ebebeb",
                        middle: "#a3a3a3",
                        bottom: "#616161",
                    }
                }

                const order = [
                    "outerTop",
                    "cube",
                    "inner_outer",
                    "inner_coop",
                    "cube",
                    "inner_coop",
                    "inner_outer",
                    "cube",
                    "outerBottom"
                ]

                let currentY = chargedUp.grid.blueTopLeftPosition().y.get(Unit.Type.INCHES);

                for (let i = 0; i < order.length; i++) {
                    const c = order[i];

                    let height = 0;
                    let color = "";

                    switch (c) {
                        case "outerTop":
                            height = chargedUp.grid.rows.lengthOfTopFieldConeSection.get(Unit.Type.INCHES);
                            color = colors.cone.outer;
                            break;
                        case "cube":
                            height = chargedUp.grid.rows.lengthOfCubeSection.get(Unit.Type.INCHES);
                            color = colors.cube;
                            break;
                        case "inner_outer":
                            height = chargedUp.grid.rows.lengthOfInnerConeSection.get(Unit.Type.INCHES);
                            color = colors.cone.outer;
                            break;
                        case "inner_coop":
                            height = chargedUp.grid.rows.lengthOfInnerConeSection.get(Unit.Type.INCHES);
                            color = colors.cone.coop;
                            break;
                        case "outerBottom":
                            height = chargedUp.grid.rows.lengthOfBottomFieldConeSection.get(Unit.Type.INCHES);
                            color = colors.cone.outer;
                            break;
                    }

                    const base = {
                        y: new Unit(currentY, Unit.Type.INCHES),
                    }

                    let assignableObj = {
                        height: new Unit(height, Unit.Type.INCHES),
                        color
                    }

                    locations.top.push(
                        {
                            y: base.y,
                            x: new Unit(generalTopRowX, Unit.Type.INCHES),
                            width: new Unit(topRowWidth, Unit.Type.INCHES),
                            height: assignableObj.height,
                            color: assignableObj.color["top"]
                        }
                    );

                    locations.middle.push(
                        {
                            y: base.y,
                            x: new Unit(middleRowX, Unit.Type.INCHES),
                            width: new Unit(middleRowWidth, Unit.Type.INCHES),
                            height: assignableObj.height,
                            color: assignableObj.color["middle"]
                        }
                    );

                    locations.bottom.push(
                        {
                            y: base.y,
                            x: new Unit(bottomRowX, Unit.Type.INCHES),
                            width: new Unit(bottomRowWidth, Unit.Type.INCHES),
                            height: assignableObj.height,
                            color: assignableObj.color["bottom"]
                        }
                    );
                    
                    currentY = height + currentY;
                }

                return locations;
            },
            getRedDimensionsList: () => {
                let locations = {
                    top: [],
                    middle: [],
                    bottom: []
                }

                const bottomRowX = chargedUp.grid.redTopLeftPosition().x.get(Unit.Type.INCHES);
                const middleRowX = bottomRowX + chargedUp.grid.rows.bottomRowWidth.get(Unit.Type.INCHES);
                const topRowX = middleRowX + chargedUp.grid.rows.middleRowWidth.get(Unit.Type.INCHES);

                const topRowWidth = chargedUp.grid.rows.topRowWidth.get(Unit.Type.INCHES);
                const middleRowWidth = chargedUp.grid.rows.middleRowWidth.get(Unit.Type.INCHES);
                const bottomRowWidth = chargedUp.grid.rows.bottomRowWidth.get(Unit.Type.INCHES);

                const colors = {
                    cone: {
                        coop: {
                            top: "#807e7e",
                            middle: "#696969",
                            bottom: "#616161",
                        },
                        outer: {
                            top: "#f25a88",
                            middle: "#cf385b",
                            bottom: "#616161",
                        }
                    },
                    cube: {
                        top: "#ebebeb",
                        middle: "#a3a3a3",
                        bottom: "#616161",
                    }
                }

                const order = [
                    "outerTop",
                    "cube",
                    "inner_outer",
                    "inner_coop",
                    "cube",
                    "inner_coop",
                    "inner_outer",
                    "cube",
                    "outerBottom"
                ]

                let currentY = chargedUp.grid.redTopLeftPosition().y.get(Unit.Type.INCHES);

                for (let i = 0; i < order.length; i++) {
                    const c = order[i];

                    let height = 0;
                    let color = "";

                    switch (c) {
                        case "outerTop":
                            height = chargedUp.grid.rows.lengthOfTopFieldConeSection.get(Unit.Type.INCHES);
                            color = colors.cone.outer;
                            break;
                        case "cube":
                            height = chargedUp.grid.rows.lengthOfCubeSection.get(Unit.Type.INCHES);
                            color = colors.cube;
                            break;
                        case "inner_outer":
                            height = chargedUp.grid.rows.lengthOfInnerConeSection.get(Unit.Type.INCHES);
                            color = colors.cone.outer;
                            break;
                        case "inner_coop":
                            height = chargedUp.grid.rows.lengthOfInnerConeSection.get(Unit.Type.INCHES);
                            color = colors.cone.coop;
                            break;
                        case "outerBottom":
                            height = chargedUp.grid.rows.lengthOfBottomFieldConeSection.get(Unit.Type.INCHES);
                            color = colors.cone.outer;
                            break;
                    }

                    const base = {
                        y: new Unit(currentY, Unit.Type.INCHES),
                    }

                    let assignableObj = {
                        height: new Unit(height, Unit.Type.INCHES),
                        color
                    }

                    locations.top.push(
                        {
                            y: base.y,
                            x: new Unit(topRowX, Unit.Type.INCHES),
                            width: new Unit(topRowWidth, Unit.Type.INCHES),
                            height: assignableObj.height,
                            color: assignableObj.color["top"]
                        }
                    );

                    locations.middle.push(
                        {
                            y: base.y,
                            x: new Unit(middleRowX, Unit.Type.INCHES),
                            width: new Unit(middleRowWidth, Unit.Type.INCHES),
                            height: assignableObj.height,
                            color: assignableObj.color["middle"]
                        }
                    );

                    locations.bottom.push(
                        {
                            y: base.y,
                            x: new Unit(bottomRowX, Unit.Type.INCHES),
                            width: new Unit(bottomRowWidth, Unit.Type.INCHES),
                            height: assignableObj.height,
                            color: assignableObj.color["bottom"]
                        }
                    );
                    
                    currentY = height + currentY;
                }

                return locations;
            }
        }
    },
    chargingStation: {
        width: new Unit(4 * 12, Unit.Type.INCHES),
        height: new Unit(8 * 12, Unit.Type.INCHES),
        rampWidth: new Unit(13.11, Unit.Type.INCHES),
        rampHeight: new Unit((8 * 12) + 1.25, Unit.Type.INCHES),
        fromTopOffset: new Unit(59.39, Unit.Type.INCHES),
        fromGridOffset: new Unit(96.75, Unit.Type.INCHES),
        topTopLeftCornerBlueSide: () => {
            return {
                x: new Unit(chargedUp.grid.depth.get(Unit.Type.INCHES) + chargedUp.chargingStation.fromGridOffset.get(Unit.Type.INCHES), Unit.Type.INCHES),
                y: new Unit(chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES) - chargedUp.chargingStation.fromTopOffset.get(Unit.Type.INCHES) - chargedUp.chargingStation.height.get(Unit.Type.INCHES), Unit.Type.INCHES)
            };
        },
        topTopLeftCornerRedSide: () => {
            return {
                x: new Unit(chargedUp.field.width.fullMeasure.get(Unit.Type.INCHES) - chargedUp.grid.depth.get(Unit.Type.INCHES) - chargedUp.chargingStation.fromGridOffset.get(Unit.Type.INCHES) - chargedUp.chargingStation.width.get(Unit.Type.INCHES), Unit.Type.INCHES),
                y: new Unit(chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES) - chargedUp.chargingStation.fromTopOffset.get(Unit.Type.INCHES) - chargedUp.chargingStation.height.get(Unit.Type.INCHES), Unit.Type.INCHES)
            }
        },

        wireCover: {
            offsetFromGrid: new Unit(95.25, Unit.Type.INCHES),
            height: new Unit(59.39, Unit.Type.INCHES),
            width: new Unit(7, Unit.Type.INCHES),
            blueTopLeftCorner: () => {
                return {
                    x: new Unit(
                        chargedUp.grid.depth.get(Unit.Type.INCHES) 
                        + chargedUp.chargingStation.wireCover.offsetFromGrid.get(Unit.Type.INCHES)
                        + (chargedUp.chargingStation.width.get(Unit.Type.INCHES) / 2)
                        - (chargedUp.chargingStation.wireCover.width.get(Unit.Type.INCHES) / 2)
                    , Unit.Type.INCHES),
                    y: new Unit(
                        chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES)
                        - chargedUp.chargingStation.wireCover.height.get(Unit.Type.INCHES)
                    , Unit.Type.INCHES)
                };
            },
            redTopLeftCorner: () => {
                return {
                    x: new Unit(
                        chargedUp.field.width.fullMeasure.get(Unit.Type.INCHES)
                        - chargedUp.grid.depth.get(Unit.Type.INCHES)
                        - chargedUp.chargingStation.wireCover.offsetFromGrid.get(Unit.Type.INCHES)
                        - (chargedUp.chargingStation.width.get(Unit.Type.INCHES) / 2)
                        - (chargedUp.chargingStation.wireCover.width.get(Unit.Type.INCHES) / 2)
                    , Unit.Type.INCHES),
                    y: new Unit(
                        chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES)
                        - chargedUp.chargingStation.wireCover.height.get(Unit.Type.INCHES)
                    , Unit.Type.INCHES)
                }
            }
        }
    },
    barrier: {
        offsetFromTopOfChargingStation: new Unit(59.39, Unit.Type.INCHES),
        width: new Unit(69.69 + 13.11, Unit.Type.INCHES), //Ramp width + distance from grid to ramp
        height: new Unit(2, Unit.Type.INCHES),
        blueTopLeftCorner: () => {
            return {
                x: new Unit(chargedUp.grid.depth.get(Unit.Type.INCHES), Unit.Type.INCHES),
                y: new Unit(chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES) - chargedUp.chargingStation.fromTopOffset.get(Unit.Type.INCHES) - chargedUp.chargingStation.height.get(Unit.Type.INCHES) - chargedUp.barrier.offsetFromTopOfChargingStation.get(Unit.Type.INCHES) - chargedUp.barrier.height.get(Unit.Type.INCHES), Unit.Type.INCHES)
            }
        },
        redTopLeftCorner: () => {
            return {
                x: new Unit(chargedUp.field.width.fullMeasure.get(Unit.Type.INCHES) - chargedUp.grid.depth.get(Unit.Type.INCHES) - chargedUp.barrier.width.get(Unit.Type.INCHES), Unit.Type.INCHES),
                y: new Unit(chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES) - chargedUp.chargingStation.fromTopOffset.get(Unit.Type.INCHES) - chargedUp.chargingStation.height.get(Unit.Type.INCHES) - chargedUp.barrier.offsetFromTopOfChargingStation.get(Unit.Type.INCHES) - chargedUp.barrier.height.get(Unit.Type.INCHES), Unit.Type.INCHES)
            }
        }
    },
    markings: {
        width: new Unit(2, Unit.Type.INCHES),
        communityZone: {
            getBlueLinePositions: () => {
                const width = chargedUp.markings.width.get(Unit.Type.INCHES);

                const start = {
                    x: chargedUp.barrier.blueTopLeftCorner().x.get(Unit.Type.INCHES) + (width / 2) + chargedUp.barrier.width.get(Unit.Type.INCHES),
                    y: chargedUp.barrier.blueTopLeftCorner().y.get(Unit.Type.INCHES) + (chargedUp.barrier.height.get(Unit.Type.INCHES) / 2)
                }

                const point1 = {
                    x: chargedUp.barrier.blueTopLeftCorner().x.get(Unit.Type.INCHES) + (width / 2) + chargedUp.barrier.width.get(Unit.Type.INCHES),
                    y: chargedUp.chargingStation.topTopLeftCornerBlueSide().y.get(Unit.Type.INCHES) - (width / 2)
                }

                const point2 = {
                    x: chargedUp.chargingStation.topTopLeftCornerBlueSide().x.get(Unit.Type.INCHES) + (width / 2) + chargedUp.chargingStation.width.get(Unit.Type.INCHES) + chargedUp.chargingStation.rampWidth.get(Unit.Type.INCHES),
                    y: chargedUp.chargingStation.topTopLeftCornerBlueSide().y.get(Unit.Type.INCHES) - (width / 2)
                }

                const point3 = {
                    x: chargedUp.chargingStation.topTopLeftCornerBlueSide().x.get(Unit.Type.INCHES) + (width / 2) + chargedUp.chargingStation.width.get(Unit.Type.INCHES) + chargedUp.chargingStation.rampWidth.get(Unit.Type.INCHES),
                    y: chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES)
                }

                const prePoses = [start, point1, point2, point3];

                //Convert to inches
                let poses = [];

                for (let i = 0; i < prePoses.length; i++) {
                    poses.push({
                        x: new Unit(prePoses[i].x, Unit.Type.INCHES),
                        y: new Unit(prePoses[i].y, Unit.Type.INCHES)
                    })
                }

                return poses;
            },
            getRedLinePositions: () => {
                const width = chargedUp.markings.width.get(Unit.Type.INCHES);
                
                const start = {
                    x: chargedUp.barrier.redTopLeftCorner().x.get(Unit.Type.INCHES) - (width / 2),
                    y: chargedUp.barrier.redTopLeftCorner().y.get(Unit.Type.INCHES) + (chargedUp.barrier.height.get(Unit.Type.INCHES) / 2)
                }

                const point1 = {
                    x: chargedUp.barrier.redTopLeftCorner().x.get(Unit.Type.INCHES) - (width / 2),
                    y: chargedUp.chargingStation.topTopLeftCornerRedSide().y.get(Unit.Type.INCHES) - (width / 2)
                }

                const point2 = {
                    x: chargedUp.chargingStation.topTopLeftCornerRedSide().x.get(Unit.Type.INCHES) - (width / 2) - chargedUp.chargingStation.rampWidth.get(Unit.Type.INCHES),
                    y: chargedUp.chargingStation.topTopLeftCornerRedSide().y.get(Unit.Type.INCHES) - (width / 2)
                }

                const point3 = {
                    x: chargedUp.chargingStation.topTopLeftCornerRedSide().x.get(Unit.Type.INCHES) - (width / 2) - chargedUp.chargingStation.rampWidth.get(Unit.Type.INCHES),
                    y: chargedUp.field.height.fullMeasure.get(Unit.Type.INCHES)
                }

                const prePoses = [start, point1, point2, point3];

                //Convert to inches
                let poses = [];

                for (let i = 0; i < prePoses.length; i++) {
                    poses.push({
                        x: new Unit(prePoses[i].x, Unit.Type.INCHES),
                        y: new Unit(prePoses[i].y, Unit.Type.INCHES)
                    })
                }

                return poses;
            }
        },
        substationZone: {
            getRedLinePositions: () => {
                const width = chargedUp.markings.width.get(Unit.Type.INCHES);

                const start = {
                    x: chargedUp.barrier.blueTopLeftCorner().x.get(Unit.Type.INCHES) + (width / 2) + chargedUp.barrier.width.get(Unit.Type.INCHES),
                    y: chargedUp.barrier.blueTopLeftCorner().y.get(Unit.Type.INCHES) + (chargedUp.barrier.height.get(Unit.Type.INCHES) / 2)
                };

                const point1 = {
                    x: chargedUp.barrier.blueTopLeftCorner().x.get(Unit.Type.INCHES) + (width / 2) + chargedUp.barrier.width.get(Unit.Type.INCHES),
                    y: 50.50,
                }

                const point2 = {
                    x: chargedUp.field.width.halfMeasure.get(Unit.Type.INCHES) - 61.36,
                    y: 50.50,
                }

                const point3 = {
                    x: chargedUp.field.width.halfMeasure.get(Unit.Type.INCHES) - 61.36,
                    y: 0,
                }

                const prePoses = [start, point1, point2, point3];

                //Convert to inches
                let poses = [];

                for (let i = 0; i < prePoses.length; i++) {
                    poses.push({
                        x: new Unit(prePoses[i].x, Unit.Type.INCHES),
                        y: new Unit(prePoses[i].y, Unit.Type.INCHES)
                    })
                }

                return poses;
            },

            getBlueLinePositions() {
                const width = chargedUp.markings.width.get(Unit.Type.INCHES);

                const start = {
                    x: chargedUp.barrier.redTopLeftCorner().x.get(Unit.Type.INCHES) - (width / 2),
                    y: chargedUp.barrier.redTopLeftCorner().y.get(Unit.Type.INCHES) + (chargedUp.barrier.height.get(Unit.Type.INCHES) / 2)
                };

                const point1 = {
                    x: chargedUp.barrier.redTopLeftCorner().x.get(Unit.Type.INCHES) - (width / 2),
                    y: 50.50,
                }

                const point2 = {
                    x: chargedUp.field.width.halfMeasure.get(Unit.Type.INCHES) + 61.36,
                    y: 50.50,
                }

                const point3 = {
                    x: chargedUp.field.width.halfMeasure.get(Unit.Type.INCHES) + 61.36,
                    y: 0,
                }

                const prePoses = [start, point1, point2, point3];

                //Convert to inches
                let poses = [];

                for (let i = 0; i < prePoses.length; i++) {
                    poses.push({
                        x: new Unit(prePoses[i].x, Unit.Type.INCHES),
                        y: new Unit(prePoses[i].y, Unit.Type.INCHES)
                    })
                }

                return poses;
            }
        }
    },
    substation: {
        doubleSubstation: {
            height: () => {
                return new Unit(chargedUp.grid.blueTopLeftPosition().y.get(Unit.Type.INCHES), Unit.Type.INCHES)
            },
            depth: new Unit(13.94, Unit.Type.INCHES),

            redTopLeftCorner: () => {
                return {
                    x: new Unit(0, Unit.Type.INCHES),
                    y: new Unit(0, Unit.Type.INCHES)
                }
            },
            blueTopLeftCorner: () => {
                return {
                    x: new Unit(chargedUp.field.width.fullMeasure.get(Unit.Type.INCHES) - chargedUp.substation.doubleSubstation.depth.get(Unit.Type.INCHES), Unit.Type.INCHES),
                    y: new Unit(0, Unit.Type.INCHES)
                }
            }
        }
    },
    aprilTags: [
        new AprilTag(
            1,
            new Unit(610.77, Unit.Type.INCHES), new Unit(42.19, Unit.Type.INCHES), new Unit(18.22, Unit.Type.INCHES),
            new Angle(180, Angle.Type.DEGREES),
            defaultAprilTagSize,
            true
        ),
        new AprilTag(
            2,
            new Unit(610.77, Unit.Type.INCHES), new Unit(108.19, Unit.Type.INCHES), new Unit(18.22, Unit.Type.INCHES),
            new Angle(180, Angle.Type.DEGREES),
            defaultAprilTagSize,
            true
        ),
        new AprilTag(
            3,
            new Unit(610.77, Unit.Type.INCHES), new Unit(174.19, Unit.Type.INCHES), new Unit(18.22, Unit.Type.INCHES),
            new Angle(180, Angle.Type.DEGREES),
            defaultAprilTagSize,
            true
        ),
        new AprilTag(
            4,
            new Unit(636.69, Unit.Type.INCHES), new Unit(265.74, Unit.Type.INCHES), new Unit(27.38, Unit.Type.INCHES),
            new Angle(180, Angle.Type.DEGREES),
            defaultAprilTagSize,
            true
        ),
        new AprilTag(
            5,
            new Unit(14.25, Unit.Type.INCHES), new Unit(265.74, Unit.Type.INCHES), new Unit(27.38, Unit.Type.INCHES),
            new Angle(0, Angle.Type.DEGREES),
            defaultAprilTagSize,
            true
        ),
        new AprilTag(
            6,
            new Unit(40.45, Unit.Type.INCHES), new Unit(174.19, Unit.Type.INCHES), new Unit(18.22, Unit.Type.INCHES),
            new Angle(0, Angle.Type.DEGREES),
            defaultAprilTagSize,
            true
        ),
        new AprilTag(
            7,
            new Unit(40.45, Unit.Type.INCHES), new Unit(108.19, Unit.Type.INCHES), new Unit(18.22, Unit.Type.INCHES),
            new Angle(0, Angle.Type.DEGREES),
            defaultAprilTagSize,
            true
        ),
        new AprilTag(
            8,
            new Unit(40.45, Unit.Type.INCHES), new Unit(42.19, Unit.Type.INCHES), new Unit(18.22, Unit.Type.INCHES),
            new Angle(0, Angle.Type.DEGREES),
            defaultAprilTagSize,
            true
        ),
    ],
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

        let physicalObjects = [];

        global.physObjs = [];

        //Create balls (rapid react specific)
        let balls = [];

        //Create scoring system (charged up specific)
        let chargedUpScoring = {};

        if ((Object.keys(this.props || {}).includes("game") ? this.props.game : "rapidReact") == "rapidReact") {
            const ballRadius = rapidReact.balls.radiusFromCenter.getcu(i2p, Unit.Type.INCHES);

            let i = 0;
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
        } else if (this.props.game == "chargedUp") {
            chargedUpScoring = {
                blue: {
                    /** 
                     * This is based on the field diagrams. If looking from grid from 
                     * the center, the bottom would be the left and the top would be the right.
                    */
                    bottomOuterGrid: {
                        top: new Array(3).fill(0),
                        middle: new Array(3).fill(0),
                        bottom: new Array(3).fill(0)
                    },
                    coopGrid: {
                        top: new Array(3).fill(0),
                        middle: new Array(3).fill(0),
                        bottom: new Array(3).fill(0)
                    },
                    topOuterGrid: {
                        top: new Array(3).fill(0),
                        middle: new Array(3).fill(0),
                        bottom: new Array(3).fill(0)
                    }
                },
                red: {
                    /**
                     * This is based on the field diagrams. If looking from grid from
                     * the center, the bottom would be the right and the top would be the left.
                     */
                    bottomOuterGrid: {
                        top: new Array(3).fill(0),
                        middle: new Array(3).fill(0),
                        bottom: new Array(3).fill(0)
                    },
                    coopGrid: {
                        top: new Array(3).fill(0),
                        middle: new Array(3).fill(0),
                        bottom: new Array(3).fill(0)
                    },
                    topOuterGrid: {
                        top: new Array(3).fill(0),
                        middle: new Array(3).fill(0),
                        bottom: new Array(3).fill(0)
                    }
                }
            }
        }

        //Clear physical objects if in planning mode
        if (simulationType == Field.SimulType.Planning) {
            physicalObjects = [];
        }

        //For testing
        console.log(physicalObjects)

        //Save to state
        this.state = {
            game: "chargedUp",
            rapidReact: {
                scores: {
                    blue: 0,
                    red: 0,
                },
                balls,
                physicalObjects,
                mouseBall: new Ball(0, 0, "black", new Unit(9.5, Unit.Type.INCHES).getcu(i2p, Unit.Type.INCHES) / 2),
            },
            chargedUp: {
                scores: chargedUpScoring,
                physicalObjects,
                mouseBall: new Ball(0, 0, "black", new Unit(9.5, Unit.Type.INCHES).getcu(i2p, Unit.Type.INCHES) / 2),
            },
            aprilTags: new AprilTagManager(i2p),
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

            players: [],
            playerStart: new PlayerStartManager(maxAmountOfPlayers, {
                x: rapidReact.field.width.halfMeasure.getcu(i2p, Unit.Type.INCHES),
                y: rapidReact.field.height.halfMeasure.getcu(i2p, Unit.Type.INCHES)
            }, 150),

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
                timeline: false,
                positionEvents: true
            },

            timeline: new TimelinePlanner(rapidReact.autonomousLength),

            generatedPath: [],

            closestPointToPathFromMouse: {x: 0, y: 0, indexOnPath: 0, highestIndex: 0},
            closestPosEventToMouse: {x: 0, y: 0},

            positionEvents: [],
            transformMenuToPositionEventEditor: false,

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
                    y: 0,
                    lastAngle: 0
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
                    name: 'Create Position Event',
                    action: () => {
                        this.state.positionEvents.push(
                            new PositionEvent(
                                this.state.closestPointToPathFromMouse.x,
                                this.state.closestPointToPathFromMouse.y,
                                PositionEvent.Type.Rotation, 
                                {},
                                this.state.closestPointToPathFromMouse.indexOnPath / this.state.closestPointToPathFromMouse.highestIndex
                            )
                        )
                        this.state.planner.updatePositionEvents(this.state.positionEvents)
                    },
                    renderCondition: () => {
                        if (this.state.transformMenuToPositionEventEditor) return false;
                        return this.state.generatedPath.length > 0;
                    }
                },
                {
                    name: "Create Hard Point",
                    action: (x, y) => {
                        this.state.planner.addPosition({
                            x,
                            y,
                            type: Field.PointType.Hard
                        });
                    },
                    renderCondition: () => {
                        if (this.state.transformMenuToPositionEventEditor) return false;
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
                        if (this.state.transformMenuToPositionEventEditor) return false;
                        return this.state.planner.getPositions().length > 0;
                    }
                },
                {
                    name: 'Hide Points',
                    action: () => {
                        this.state.show.pathPoints = false;
                    },
                    renderCondition: () => {
                        if (this.state.transformMenuToPositionEventEditor) return false;
                        return this.state.show.pathPoints;
                    }
                },
                {
                    name: 'Show Points',
                    action: () => {
                        this.state.show.pathPoints = true;
                    },
                    renderCondition: () => {
                        if (this.state.transformMenuToPositionEventEditor) return false;
                        return !this.state.show.pathPoints;
                    }
                },
                {
                    name: 'Hide Generated Path',
                    action: () => {
                        this.state.show.generatedPath = false;
                    },
                    renderCondition: () => {
                        if (this.state.transformMenuToPositionEventEditor) return false;
                        return this.state.show.generatedPath;
                    }
                },
                {
                    name: 'Show Generated Path',
                    action: () => {
                        this.state.show.generatedPath = true;
                    },
                    renderCondition: () => {
                        if (this.state.transformMenuToPositionEventEditor) return false;
                        return !this.state.show.generatedPath;
                    }
                },
                {
                    name: 'Show Position Events',
                    action: () => {
                        this.state.show.positionEvents = true;
                    },
                    renderCondition: () => {
                        if (this.state.transformMenuToPositionEventEditor) return false;
                        return this.state.positionEvents.length > 0 && !this.state.show.positionEvents;
                    }
                },
                {
                    name: 'Hide Position Events',
                    action: () => {
                        this.state.show.positionEvents = false;
                    },
                    renderCondition: () => {
                        if (this.state.transformMenuToPositionEventEditor) return false;
                        return this.state.positionEvents.length > 0 && this.state.show.positionEvents;
                    }
                },
                {
                    name: 'Change type',
                    action: () => {
                        delete this.state.keysDown["a"];
                        const newType = prompt("What's the new type? Types: " + Object.keys(PositionEvent.Type).join(", "));
                        if (newType) {
                            let currentEditing = -1;
                            for (let i = 0; i < this.state.positionEvents.length; i++) {
                                if (
                                    dist(
                                    this.state.positionEvents[i].x, 
                                    this.state.positionEvents[i].y, 
                                    this.state.closestPosEventToMouse.x, 
                                    this.state.closestPosEventToMouse.y) < 1
                                ) {
                                    currentEditing = Number(i);
                                }
                            }

                            if (Object.keys(PositionEvent.Type).includes(newType)) {
                                if (currentEditing > -1) {
                                    this.state.positionEvents[currentEditing].type = PositionEvent.Type[newType];
                                } else {
                                    alert("An error occurred, couldn't find what was being edited.")
                                }
                            } else {
                                alert("Not correct type.")
                            }
                        }

                        this.state.planner.updatePositionEvents(this.state.positionEvents)
                    },
                    renderCondition: () => {
                        if (!this.state.transformMenuToPositionEventEditor) return false;
                        return true;
                    }
                },
                {
                    name: 'Edit primary value',
                    action: () => {
                        delete this.state.keysDown["a"];

                        let currentEditing = -1;
                        for (let i = 0; i < this.state.positionEvents.length; i++) {
                            if (
                                dist(
                                this.state.positionEvents[i].x, 
                                this.state.positionEvents[i].y, 
                                this.state.closestPosEventToMouse.x, 
                                this.state.closestPosEventToMouse.y) < 1
                            ) {
                                currentEditing = Number(i);
                            }
                        }

                        if (currentEditing == -1) {
                            alert("An error occured an the position being edited wasn't found.")
                            return;
                        }

                        const editingType = this.state.positionEvents[currentEditing].type;

                        const editing = PositionEvent.PrimaryValueNameStorage[editingType];

                        const newValue = prompt("What's the new " + editing + " value?");
                        if (newValue) {
                            const numberOfValue = Number(newValue);

                            if (isNaN(numberOfValue) || numberOfValue == null) {
                                alert("The number provided was not able to be transformed into a number.")
                                return;
                            }

                            const transformed = PositionEvent.PrimaryValueProcess[editingType](numberOfValue);

                            this.state.positionEvents[currentEditing].data[editing] = transformed;
                        }

                        this.state.planner.updatePositionEvents(this.state.positionEvents)
                    },
                    renderCondition: () => {
                        if (!this.state.transformMenuToPositionEventEditor) return false;
                        return true;
                    }
                },
                {
                    name: 'Delete position event',
                    action: () => {
                        let indexToBeDeleted = -1;
                        for (let i = 0; i < this.state.positionEvents.length; i++) {
                            if (
                                dist(
                                this.state.positionEvents[i].x, 
                                this.state.positionEvents[i].y, 
                                this.state.closestPosEventToMouse.x, 
                                this.state.closestPosEventToMouse.y) < 1
                            ) {
                                indexToBeDeleted = Number(i);
                            }
                        }

                        if (indexToBeDeleted > -1) {
                            this.state.positionEvents.splice(indexToBeDeleted, 1)
                        }

                        this.state.planner.updatePositionEvents(this.state.positionEvents)
                    },
                    renderCondition: () => {
                        if (!this.state.transformMenuToPositionEventEditor) return false;
                        return true;
                    }
                }
            ],

            mouse: {x: 0, y: 0}
        }

        if (this.state.game == "chargedUp") {
            this.state.aprilTags = new AprilTagManager(i2p, chargedUp.aprilTags, true);
        }

        if (simulationType == Field.SimulType.Planning) { 
            //TODO: Add this in when releasing
            // window.onbeforeunload = () => {
            //     return this.state.positions.length > 0;
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

                save(`path/${pathName}`, path)

                //localStorage.setItem(pathName, pathString);
            }

            window.loadPathLocal = (pathName="default") => {
                if (pathName == "get") {
                    let pathNameList = [];
                    const paths = load("path");
                    for (let key of Object.keys(paths)) {
                        pathNameList.push(key);
                    }
                    alert("Path names: " + pathNameList.join(", "));
                    return;
                }

                let pathString = load(`path/${pathName}`)

                if (pathName.startsWith("legacy ")) {
                    pathString = JSON.parse(localStorage.getItem(pathName.replace("legacy ", "")));
                }

                let path = pathString;
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

                window.lastLoadedFile = pathName.replace("legacy ", "");
            }
        }
    }

    togglePlanningMenu(open=!this.state.planningMenu) {
        if (dist(this.state.mouse.x, this.state.mouse.y, this.state.closestPosEventToMouse.x, this.state.closestPosEventToMouse.y) < positionEventEditDistance && open) {
            this.state.transformMenuToPositionEventEditor = true;
        } else {
            this.state.transformMenuToPositionEventEditor = false;
        }

        this.setState({
            planningMenu: open,
            planningMenuJustOpened: true
        })
        this.state.planningMenu = open;
        this.state.planningMenuJustOpened = true;
    }

    chargedUp(ctx, frameCount, rel, canvas, mouse) {
        const width = canvas.width;
        const height = canvas.height;
        const i2p = this.state.i2p;

        //Draw background
        ctx.fillStyle = "gray";
        ctx.fillRect(0, 0, width, height);

        //Draw middle line
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();

        //Draw markings
        //draw community zone lines for blue
        ctx.lineWidth = chargedUp.markings.width.getcu(i2p, Unit.Type.INCHES);


        ctx.strokeStyle = "blue";

        ctx.beginPath();

        let first = true;

        ctx.moveTo(
            chargedUp.markings.communityZone.getBlueLinePositions()[0].x.getcu(i2p, Unit.Type.INCHES), 
            chargedUp.markings.communityZone.getBlueLinePositions()[0].y.getcu(i2p, Unit.Type.INCHES)
        );

        for (let p of chargedUp.markings.communityZone.getBlueLinePositions()) {
            if (first) { first = false; continue; }

            ctx.lineTo(
                p.x.getcu(i2p, Unit.Type.INCHES),
                p.y.getcu(i2p, Unit.Type.INCHES)
            );
        }

        ctx.stroke();

        //draw substation zone lines for blue
        
        ctx.beginPath();

        first = true;

        ctx.moveTo(
            chargedUp.markings.substationZone.getBlueLinePositions()[0].x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.markings.substationZone.getBlueLinePositions()[0].y.getcu(i2p, Unit.Type.INCHES)
        );

        for (let p of chargedUp.markings.substationZone.getBlueLinePositions()) {
            if (first) { first = false; continue; }

            ctx.lineTo(
                p.x.getcu(i2p, Unit.Type.INCHES),
                p.y.getcu(i2p, Unit.Type.INCHES)
            );
        }

        ctx.stroke();

        //draw red lines
        ctx.strokeStyle = "red";

        //draw red community zone lines
        ctx.beginPath();

        first = true;

        ctx.moveTo(
            chargedUp.markings.communityZone.getRedLinePositions()[0].x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.markings.communityZone.getRedLinePositions()[0].y.getcu(i2p, Unit.Type.INCHES)
        );

        for (let p of chargedUp.markings.communityZone.getRedLinePositions()) {
            if (first) { first = false; continue; }

            ctx.lineTo(
                p.x.getcu(i2p, Unit.Type.INCHES),
                p.y.getcu(i2p, Unit.Type.INCHES)
            );

        }

        ctx.stroke();

        //draw red substation zone lines
        ctx.beginPath();

        first = true;

        ctx.moveTo(
            chargedUp.markings.substationZone.getRedLinePositions()[0].x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.markings.substationZone.getRedLinePositions()[0].y.getcu(i2p, Unit.Type.INCHES)
        );

        for (let p of chargedUp.markings.substationZone.getRedLinePositions()) {
            if (first) { first = false; continue; }

            ctx.lineTo(
                p.x.getcu(i2p, Unit.Type.INCHES),
                p.y.getcu(i2p, Unit.Type.INCHES)
            );

        }

        ctx.stroke();


        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";

        //draw grid area
        ctx.fillStyle = "#c1d7e8";
        ctx.fillRect(
            chargedUp.grid.blueTopLeftPosition().x.getcu(i2p, Unit.Type.INCHES), 
            chargedUp.grid.blueTopLeftPosition().y.getcu(i2p, Unit.Type.INCHES), 
            chargedUp.grid.depth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.grid.length.getcu(i2p, Unit.Type.INCHES)
        );
        
        ctx.fillStyle = "#e3b1bc";
        ctx.fillRect(
            chargedUp.grid.redTopLeftPosition().x.getcu(i2p, Unit.Type.INCHES), 
            chargedUp.grid.redTopLeftPosition().y.getcu(i2p, Unit.Type.INCHES), 
            chargedUp.grid.depth.getcu(i2p, Unit.Type.INCHES), 
            chargedUp.grid.length.getcu(i2p, Unit.Type.INCHES)
        );

        //draw game piece starts
        ctx.fillStyle = "black";

        //draw blue game piece starts
        for (let blueGamePieceStart of chargedUp.gamePieceStarts.blue()) {
            ctx.beginPath();
            ctx.arc(
                blueGamePieceStart.x.getcu(i2p, Unit.Type.INCHES), 
                blueGamePieceStart.y.getcu(i2p, Unit.Type.INCHES), 
                chargedUp.gamePieceStarts.radius.getcu(i2p, Unit.Type.INCHES),
                0, 2 * Math.PI
            );
            ctx.fill();
        }
        
        //draw red game piece starts
        for (let redGamePieceStart of chargedUp.gamePieceStarts.red()) {
            ctx.beginPath();
            ctx.arc(
                redGamePieceStart.x.getcu(i2p, Unit.Type.INCHES), 
                redGamePieceStart.y.getcu(i2p, Unit.Type.INCHES), 
                chargedUp.gamePieceStarts.radius.getcu(i2p, Unit.Type.INCHES),
                0, 2 * Math.PI
            );
            ctx.fill();
        }

        //draw charging stations
        ctx.fillStyle = "#dbdbdb";
        //draw blue charging station
        ctx.fillRect(
            chargedUp.chargingStation.topTopLeftCornerBlueSide().x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.topTopLeftCornerBlueSide().y.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.width.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.height.getcu(i2p, Unit.Type.INCHES)
        );

        //draw red charging station
        ctx.fillRect(
            chargedUp.chargingStation.topTopLeftCornerRedSide().x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.topTopLeftCornerRedSide().y.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.width.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.height.getcu(i2p, Unit.Type.INCHES)
        );

        //draw charging station ramps
        ctx.fillStyle = "#bfbfbf";

        const differenceInHeights = Math.abs(chargedUp.chargingStation.height.getcu(i2p, Unit.Type.INCHES) - chargedUp.chargingStation.rampHeight.getcu(i2p, Unit.Type.INCHES));

        //draw ramps on blue side
        ctx.fillRect(
            chargedUp.chargingStation.topTopLeftCornerBlueSide().x.getcu(i2p, Unit.Type.INCHES) - chargedUp.chargingStation.rampWidth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.topTopLeftCornerBlueSide().y.getcu(i2p, Unit.Type.INCHES) - (differenceInHeights / 2),
            chargedUp.chargingStation.rampWidth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.rampHeight.getcu(i2p, Unit.Type.INCHES)
        );

        ctx.fillRect(
            chargedUp.chargingStation.topTopLeftCornerBlueSide().x.getcu(i2p, Unit.Type.INCHES) + chargedUp.chargingStation.width.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.topTopLeftCornerBlueSide().y.getcu(i2p, Unit.Type.INCHES) - (differenceInHeights / 2),
            chargedUp.chargingStation.rampWidth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.rampHeight.getcu(i2p, Unit.Type.INCHES)
        );

        //draw ramps on red side
        ctx.fillRect(
            chargedUp.chargingStation.topTopLeftCornerRedSide().x.getcu(i2p, Unit.Type.INCHES) - chargedUp.chargingStation.rampWidth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.topTopLeftCornerRedSide().y.getcu(i2p, Unit.Type.INCHES) - (differenceInHeights / 2),
            chargedUp.chargingStation.rampWidth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.rampHeight.getcu(i2p, Unit.Type.INCHES)
        );

        ctx.fillRect(
            chargedUp.chargingStation.topTopLeftCornerRedSide().x.getcu(i2p, Unit.Type.INCHES) + chargedUp.chargingStation.width.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.topTopLeftCornerRedSide().y.getcu(i2p, Unit.Type.INCHES) - (differenceInHeights / 2),
            chargedUp.chargingStation.rampWidth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.rampHeight.getcu(i2p, Unit.Type.INCHES)
        );

        //draw wire covers
        ctx.fillStyle = "#1c1c1c";

        //blue side wire cover
        ctx.fillRect(
            chargedUp.chargingStation.wireCover.blueTopLeftCorner().x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.wireCover.blueTopLeftCorner().y.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.wireCover.width.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.wireCover.height.getcu(i2p, Unit.Type.INCHES)
        );

        //red side wire cover
        ctx.fillRect(
            chargedUp.chargingStation.wireCover.redTopLeftCorner().x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.wireCover.redTopLeftCorner().y.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.wireCover.width.getcu(i2p, Unit.Type.INCHES),
            chargedUp.chargingStation.wireCover.height.getcu(i2p, Unit.Type.INCHES)
        );

        //draw barriers
        ctx.fillStyle = "#ededed";

        //draw blue side barrier
        ctx.fillRect(
            chargedUp.barrier.blueTopLeftCorner().x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.barrier.blueTopLeftCorner().y.getcu(i2p, Unit.Type.INCHES),
            chargedUp.barrier.width.getcu(i2p, Unit.Type.INCHES),
            chargedUp.barrier.height.getcu(i2p, Unit.Type.INCHES)
        );

        //draw red side barrier
        ctx.fillRect(
            chargedUp.barrier.redTopLeftCorner().x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.barrier.redTopLeftCorner().y.getcu(i2p, Unit.Type.INCHES),
            chargedUp.barrier.width.getcu(i2p, Unit.Type.INCHES),
            chargedUp.barrier.height.getcu(i2p, Unit.Type.INCHES)
        );

        //draw double substation
        ctx.fillStyle = "#303030";
            
        //draw blue side double substation
        ctx.fillRect(
            chargedUp.substation.doubleSubstation.blueTopLeftCorner().x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.substation.doubleSubstation.blueTopLeftCorner().y.getcu(i2p, Unit.Type.INCHES),
            chargedUp.substation.doubleSubstation.depth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.substation.doubleSubstation.height().getcu(i2p, Unit.Type.INCHES)
        );

        //draw red side double substation
        ctx.fillRect(
            chargedUp.substation.doubleSubstation.redTopLeftCorner().x.getcu(i2p, Unit.Type.INCHES),
            chargedUp.substation.doubleSubstation.redTopLeftCorner().y.getcu(i2p, Unit.Type.INCHES),
            chargedUp.substation.doubleSubstation.depth.getcu(i2p, Unit.Type.INCHES),
            chargedUp.substation.doubleSubstation.height().getcu(i2p, Unit.Type.INCHES)
        );

        //draw grid details
        ctx.fillStyle = "#1c1c1c";
            
        //draw blue side grid details
        const blueSideGridDetails = chargedUp.grid.rows.getBlueDimensionsList();
        
        for (let row of Object.keys(blueSideGridDetails)) {
            for (let p of blueSideGridDetails[row]) {
                ctx.fillStyle = p.color;

                ctx.fillRect(
                    p.x.getcu(i2p, Unit.Type.INCHES),
                    p.y.getcu(i2p, Unit.Type.INCHES),
                    p.width.getcu(i2p, Unit.Type.INCHES),
                    p.height.getcu(i2p, Unit.Type.INCHES)
                );
            }
        }

        //draw red side grid details
        const redSideGridDetails = chargedUp.grid.rows.getRedDimensionsList();
        
        for (let row of Object.keys(redSideGridDetails)) {
            for (let p of redSideGridDetails[row]) {
                ctx.fillStyle = p.color;

                ctx.fillRect(
                    p.x.getcu(i2p, Unit.Type.INCHES),
                    p.y.getcu(i2p, Unit.Type.INCHES),
                    p.width.getcu(i2p, Unit.Type.INCHES),
                    p.height.getcu(i2p, Unit.Type.INCHES)
                );
            }
        }
        
        
        //General stuff
        this.generalDraw(ctx, frameCount, rel, canvas, mouse)

        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, this.state.simulationType == Field.SimulType.Field ? 5 : 2, 0, 2 * Math.PI);
        ctx.fill();
        
        //write mouse pos
        // ctx.fillStyle = "black";
        // ctx.font = "20px Arial";
        // ctx.fillText(`x: ${mouse.x}, y: ${mouse.y}`, 10, 20);
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
                    //ctx.fillText("Collision " + side.between + ", " + angleOfBall.get(Angle.Radians) + "," + bottom + ", " + (Math.floor(lowerBound * 100) / 100) + ', ' + (Math.floor(upperBound * 100) / 100), 10, 50 + physObj.rotation.get(Angle.Degrees));
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
    
        this.state.aprilTags.draw(Object.assign({
            remove: (key) => {
                delete this.state.keysDown[key];
            }
        }, this.state.keysDown), ctx, mouse)

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

            //Update events in path planner
            this.state.planner.updateTimelineEvents(this.state.timeline.getEvents());

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
                    //Delete point

                    let deletedPoint = false;

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

                        //Remove position events
                        //TODO: fix this in the future, it works ok without it though so we're good
                        // if (this.state.planner.getPositions().length <= 1) {
                        //     this.state.positionEvents = [];
                        // } else { //or readjust their references
                        //     for (let posEvent of this.state.positionEvents) {
                        //         posEvent.readjustReference(this.state.generatedPath);
                        //     }
                        // }

                        deletedPoint = true;
                    }

                    this.state.mousePickedUp = -1;

                    this.state.generatedPath = this.state.planner.generateBezierCurve({
                        distBetweenPoints: baseDistanceBetweenPoints
                    });

                    //TODO: Same w/ this, need to fix it in the future but it still works fine
                    //I can still adjust points and stuff, but it may cause some issues.
                    // if (!deletedPoint) {
                    //     for (let posEvent of this.state.positionEvents) {
                    //         posEvent.readjustPosition(this.state.generatedPath);
                    //     }
                    // }

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
                
                if (this.state.show.positionEvents && this.state.generatedPath.length > 0) {
                    //Find the closest point to the mouse onthe path.
                    let closestPointToMouse = {x: -100, y: -100, distanceOnPath: -1}
                    let closestDistance = 99999999;
                    let highestIndex = 0;
                    for (let i = 0; i < this.state.generatedPath.length; i++) {
                        const path = this.state.generatedPath[i];
                        for (let j = 0; j < path.length; j++) {
                            const distToMouse = dist(path[j].x, path[j].y, mouse.x, mouse.y);

                            if (distToMouse < closestDistance) {
                                closestDistance = distToMouse;
                                closestPointToMouse = {
                                    x: path[j].x, 
                                    y: path[j].y, 
                                    indexOnPath: Number(highestIndex)
                                }
                            }

                            highestIndex += 1;
                        }
                    }

                    let closestPosEventToMouse = {x: -100, y: -100}
                    let closestPosEventDistance = 99999999;
                    let closestPosIndex = -1;
                    for (let i = 0; i < this.state.positionEvents.length; i++) {
                        const pos = this.state.positionEvents[i];
                        const distToMouse = dist(pos.x, pos.y, mouse.x, mouse.y);
                        if (distToMouse < closestPosEventDistance) {
                            closestPosEventDistance = distToMouse;
                            closestPosEventToMouse = {x: pos.x, y: pos.y}
                            closestPosIndex = Math.round(i / 1);
                        }
                    }

                    if (!this.state.planningMenu) {
                        this.state.closestPointToPathFromMouse = Object.assign({
                            highestIndex
                        }, closestPointToMouse);
                        this.state.closestPosEventToMouse = Object.assign({}, closestPosEventToMouse);
                    }

                    if (closestPosEventDistance > positionEventEditDistance && !this.state.transformMenuToPositionEventEditor) {
                        ctx.strokeStyle = "black";
                        ctx.beginPath();
                        ctx.arc(this.state.closestPointToPathFromMouse.x, this.state.closestPointToPathFromMouse.y, 5, 0, 2 * Math.PI)
                        ctx.fill();
                        ctx.stroke();
                    } else {
                        ctx.strokeStyle = "red";
                        ctx.beginPath();
                        ctx.arc(this.state.closestPosEventToMouse.x, this.state.closestPosEventToMouse.y, 5, 0, 2 * Math.PI)
                        ctx.fill();
                        ctx.stroke();
                    }

                    ctx.strokeStyle = "black";
                    
                    for (let i = 0; i < this.state.positionEvents.length; i++) {
                        let color = "black";
                        if ((i == closestPosIndex && closestPosEventDistance <= positionEventEditDistance) ||
                            (dist(
                                this.state.positionEvents[i].x, 
                                this.state.positionEvents[i].y, 
                                this.state.closestPosEventToMouse.x, 
                                this.state.closestPosEventToMouse.y) < 1 &&
                                this.state.transformMenuToPositionEventEditor)) {
                            color = "red";
                        }

                        this.state.positionEvents[i].draw(i2p, ctx, color);
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
                            x: trajPath[indexInGeneratedTrajectory][0].data.position.x.getcu(i2p, Unit.Type.INCHES),
                            y: trajPath[indexInGeneratedTrajectory][0].data.position.y.getcu(i2p, Unit.Type.INCHES)
                        }

                        //window["__currentPos"] = { currentPos, indexInGeneratedTrajectory, p: trajPath[indexInGeneratedTrajectory] };

                        ctx.fillStyle = "#ff0000";
                        ctx.beginPath();
                        ctx.arc(currentPos.x, currentPos.y, 10, 0, 2 * Math.PI);
                        ctx.fill();
                        ctx.stroke();

                        let angle = this.state.playback.robot.lastAngle;
                        // if (indexInGeneratedTrajectory < trajPath.length - 1) {
                        //     const nextPos = {
                        //         x: trajPath[indexInGeneratedTrajectory + 1][0].data.position.x.getcu(i2p, Unit.Type.INCHES),
                        //         y: trajPath[indexInGeneratedTrajectory + 1][0].data.position.y.getcu(i2p, Unit.Type.INCHES)
                        //     }
                        //     angle = Math.atan2(nextPos.y - currentPos.y, nextPos.x - currentPos.x);
                        // } else {
                        //     const prevPos = {
                        //         x: trajPath[indexInGeneratedTrajectory - 1][0].data.position.x.getcu(i2p, Unit.Type.INCHES),
                        //         y: trajPath[indexInGeneratedTrajectory - 1][0].data.position.y.getcu(i2p, Unit.Type.INCHES)
                        //     }
                        //     angle = Math.atan2(currentPos.y - prevPos.y, currentPos.x - prevPos.x);
                        // }

                        if (trajPath[indexInGeneratedTrajectory].filter(e => e.type == FieldTypes.Timeline.Drive).length > 0) {
                            angle = trajPath[indexInGeneratedTrajectory].filter(e => e.type == FieldTypes.Timeline.Drive)[0].data.angle
                        }

                        this.state.robotDimensions.draw(ctx, currentPos.x, currentPos.y, new Angle(angle, Angle.Radians));
                        
                        this.state.playback.robot.lastAngle = angle;

                        ctx.strokeStyle = "rgb(220, 40, 187)";
                        ctx.lineWidth = 2;

                        let noDisplayTag = false;

                        if (Object.keys(window).includes("no_tag_display")) {
                            noDisplayTag = window["no_tag_display"];
                        }

                        if (!noDisplayTag) {
                            this.state.aprilTags.tags.forEach(tag => {
                                ctx.beginPath();
                                const tagX = typeof tag.x == "object" ? tag.x.getcu(i2p, Unit.Type.INCHES) : tag.x;
                                const tagY = typeof tag.y == "object" ? tag.y.getcu(i2p, Unit.Type.INCHES) : tag.y;
    
                                ctx.moveTo(tagX, tagY)
                                ctx.lineTo(currentPos.x, currentPos.y)
                                ctx.stroke();
                            })
                        }
                        
                        

                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "black";
                    }
                }
            }

            //Draw generated PID if it was generated.
            for (let trajPathPoint of (this.state.planner.getGeneratedPIDTrajectory() || [])) {
                ctx.fillStyle = Object.keys(trajPathPoint).includes("hard") ? "red" : "green";

                ctx.beginPath();
                ctx.arc(trajPathPoint.x, trajPathPoint.y, 5, 0, 2 * Math.PI);
                ctx.fill();
            }

            //--Timeline--

            //update timeline planner with how long it's been playing for
            this.state.timeline.updateTimePlayed(this.state.playback.getTimePlaying());

            if (this.state.show.timeline) {
                this.state.timeline.draw(ctx, frameCount, rel, canvas, mouse)
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
                let pmPos = Object.assign({}, this.state.planningMenuPos);

                const options = this.state.planningMenuOptions.filter(option => option.renderCondition())

                let doingEasierSee = false;

                if (pmPos.y + options.length * 30 > ctx.canvas.height) {
                    pmPos.y -= options.length * 30;

                    doingEasierSee = true;
                }

                ctx.fillStyle = "#dd28ed";
                ctx.beginPath();
                ctx.arc(this.state.planningMenuPos.x, this.state.planningMenuPos.y, 5, 0, 2 * Math.PI);
                ctx.fill();

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
                        options[i].action(pmPos.x, pmPos.y + (doingEasierSee ? options.length * 30 : 0));
                        this.togglePlanningMenu();

                        this.state.generatedPath = this.state.planner.generateBezierCurve({
                            distBetweenPoints: baseDistanceBetweenPoints
                        });
                    }
                }
            }
        } else if (this.state.simulationType == Field.SimulType.Field) {
            //Draw starts for robot.
            this.state.playerStart.draw(ctx, i2p, mouse, this.state.keysDown);

            if (this.state.keysDown["u"] && this.state.players.length == 0) {
                let positions = this.state.playerStart.returnPositions();
                let randomTeam = probability(0.5).predict() ? "red" : "blue";
                let randomPos = random(0, positions[randomTeam].length - 1);

                let newPlayer = new RapidReactPlayer(positions[randomTeam][randomPos], randomTeam == "blue" ? RapidReactPlayer.Team.BLUE : RapidReactPlayer.Team.RED);
                newPlayer.isAi = true;
                newPlayer.rotation = new Angle(0, Angle.Radians);

                this.state.players.push(newPlayer)
            }

            for (let player of this.state.players) {
                player.draw(ctx, i2p);
                //remove later
                player.update(ctx, i2p, this.state[this.state.game].physicalObjects.concat(this.state[this.state.game].balls), this.state.players)
            }
        }

        //Set the mouse pos
        this.state.mouse = {x: mouse.x, y: mouse.y}
    }
    keyDown(e) {
        const lk = e.key.toLowerCase();

        if (this.state.keysDown["meta"]) {
            return;
        }
        
        const sk = () => {
            e.preventDefault();
            e.stopPropagation();
            
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
            const maxTime = this.state.timeline.getEvents().filter(event => event.type == Field.TimelineEvent.GeneralTime)[0].end * 1000;
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
            this.state.planner.updatePositionEvents(this.state.positionEvents)
            const newTimeline = this.state.planner.generateTimeline([], 0);
            this.state.timeline.generated = newTimeline;
        } else if (lk == "p" && !this.state.keysDown[lk]) {
            alert("Sending once this message is closed.")
            console.log("Sending path to robot...")
            this.state.planner.sendPathToRobot();
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

        let game = chargedUp;

        if (Object.keys(this.props || {}).includes("game")) {
            switch (this.params.game) {
                case "rapidReact":
                    game = rapidReact;
                    break;
                case "chargedUp":
                    game = chargedUp;
                    break;
                default:
                    game = chargedUp;
            }
        }

        return (
            <div id="field-parent">
                <Mover target="field-parent"></Mover>
                <Canvas id="field" 
                    width={game.field.width.fullMeasure.getcu(i2p, Unit.Type.INCHES)} 
                    height={game.field.height.fullMeasure.getcu(i2p, Unit.Type.INCHES)} 
                    draw={this.chargedUp.bind(this)}
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

export { Field, FieldTypes, chargedUp, rapidReact }