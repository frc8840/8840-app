//Types
import { FieldTypes } from "../Field";

//Traditional math functions
import {dist, prettyMuchSamePoint} from "../../misc/dist"
import fractorial from "../../misc/fractorial";
//More advanced math functions
import PID from "../../pid/PID";

//Unit math
import { Unit, Angle } from "../../misc/unit";
import PositionEvent from "./PositionEvent";

import PathFileLoader from "./files/PathFileLoader";

//Constants
const pathDeltaTime = 0.03125;


class PathPlanner {
    constructor(inchesToPixels, trajectorySettings, positions, timelineEvents) {
        const i2p = inchesToPixels;

        this.state = {
            i2p: inchesToPixels, //abbrv. inches to pixels
            positions: positions || [ //list of hard and soft points
                {
                    x: 0,
                    y: 0,
                    type: FieldTypes.Points.Hard,
                }
            ],
            trajectorySettings: { //settings for generating the path and PID
                maxSpeed: new Unit(4, Unit.Type.METERS).getcu(i2p, Unit.Type.INCHES), //m/s
                minSpeed: new Unit(0.03 * 3, Unit.Type.METERS).getcu(i2p, Unit.Type.INCHES), //m/s
                maxAccel: new Unit(2.5, Unit.Type.METERS).getcu(i2p, Unit.Type.INCHES), //m/s^2
                pid: new PID(0.075, 0.001, 0.3),
                time: 15, //s
                deltaTime: pathDeltaTime, //s

                //the generated PID trajectory
                generatedPIDTrajectory: [],
            },
            timeline: { //timeline of events
                events: timelineEvents || [
                    {
                        type: FieldTypes.Timeline.GeneralTime,
                        start: 0,
                        end: 15,
                    }
                ],
                generated: [],
            },
            positionEvents: [],
        };

        this.state.trajectorySettings = Object.assign(this.state.trajectorySettings, trajectorySettings);
    }

    updatePositions(positions) {
        this.state.positions = positions;
    }

    updatePositionEvents(posEvents) {
        this.state.positionEvents = posEvents;
    }

    addPosition(pos) {
        this.state.positions.push(pos);
    }

    getPositions() {
        return this.state.positions;
    }

    getGeneratedPIDTrajectory() {
        return this.state.trajectorySettings.generatedPIDTrajectory;
    }

    updateTimelineEvents(timelineEvents) {
        this.state.timeline.events = timelineEvents;
    } 

    addTimelineEvent(event) {
        this.state.timeline.events.push(event);
    }

    generatePathData() {
        const translatedGeneratedTime = this.state.timeline.generated.map((timepoint) => {
            const newTimepoint = timepoint.map(event => {
                const copy = Object.assign({}, event);
                let copiedAlready = false;
                if (Object.keys(event.data).includes("x") && Object.keys(event.data).includes("y")) {
                    const dataCopy = Object.assign({}, event.data);
                    copy.data = dataCopy;
                    copy.data.x = event.data.x.get(Unit.Type.INCHES);
                    copy.data.y = event.data.y.get(Unit.Type.INCHES);
                    copiedAlready = true;
                }
                if (Object.keys(event.data).includes("position")) {
                    const dataCopy = Object.assign({}, event.data);
                    copy.data = dataCopy;
                    const copyPosition = Object.assign({}, event.data.position);
                    copy.data.position = copyPosition;
                    copy.data.position.x = event.data.position.x.get(Unit.Type.INCHES);
                    copy.data.position.y = event.data.position.y.get(Unit.Type.INCHES);
                    copiedAlready = true;
                }
                if (Object.keys(event.data).includes("angle")) {
                    if (event.data.angle instanceof Angle) {
                        const dataCopy = copiedAlready ? Object.assign({}, copy.data) : Object.assign({}, event.data);
                        copy.data = dataCopy;
                        copy.data.angle = event.data.angle.get(Angle.Radians);
                    }
                }
                return copy;
            })

            return newTimepoint;
        });

        const data = {
            positions: this.state.positions,
            trajectorySettings: this.state.trajectorySettings,
            timelineEvents: this.state.timeline.events,
            generatedTimeline: translatedGeneratedTime,
            name: Object.keys(window).includes("lastLoadedFile") ? window.lastLoadedFile + "-" + Date.now() : "unnamed-" + Date.now(),
        };

        return data;
    }

    sendPathToRobot() {
        const url = window.getRobotServerURL() + "/auto/path";

        const data = this.generatePathData();

        fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }).then((res) => res.json()).then(data => {
            console.log(data);
            
            alert("Sent path to robot with name: " + data.name);
        });
    }

    generateBezierCurve(options={
        der: false, 
        distBetweenPoints: -1, //-1 for none, >0 for distance between points.
        tIncrease: 0.01, //How much to increase t by each iteration
        createList: true,
        addDistances: false,
    }) {
        //just to make sure some variables are there, just copy the above defaults
        options = Object.assign({
            der: false, 
            distBetweenPoints: -1,
            tIncrease: 0.01,
            createList: true,
            addDistances: false
        }, options);

        let lastHardPoint = 0;
        let softPoints = [];
        let curves = options["createList"] ? [[]] : [{}];
        let derCurves = [[]];

        let lookupTable = [];
        let lookup = (dist) => {
            for (let j = 0; j < lookupTable.length; j++) {
                const curve = lookupTable[j];

                for (let i = 0; i < curve.length; i++) {
                    if (i == 0 && j == 0) continue;

                    if (dist > curve[i].distance) {
                        continue;
                    }

                    const lastPoint = i == 0 ? lookupTable[j - 1][lookupTable[j - 1].length - 1] : curve[i-1];

                    //No shouldn't be by distance, should be by t value - change.
                    const differenceBetweenThisAndLast = curve[i].distance - lastPoint.distance;
                    const weight = (dist - lastPoint.distance) / differenceBetweenThisAndLast;
                    
                    const differenceInPositions = {
                        x: curve[i].x - lastPoint.x,
                        y: curve[i].y - lastPoint.y,
                    }
                    
                    return {
                        before: {
                            x: lastPoint.x,
                            y: lastPoint.y,
                            distance: lastPoint.distance,
                            curveIndex: i == 0 ? j - 1 : j,
                            pointIndex: i == 0 ? (j == 0 ? -1 : lookupTable[j - 1].length - 1) : i - 1,
                        },
                        after: {
                            x: curve[i].x,
                            y: curve[i].y,
                            distance: curve[i].distance,
                            curveIndex: j,
                            pointIndex: i,
                        },
                        approximation: {
                            x: differenceInPositions.x * weight + lastPoint.x,
                            y: differenceInPositions.y * weight + lastPoint.y,
                            distance: dist
                        }
                    }
                }
            }

            return null;
        }
        if (options.distBetweenPoints > 0) {
            lookupTable = this.generateBezierCurve({
                distBetweenPoints: -1,
                createList: true,
                tIncrease: 0.01 / 2,
                addDistances: true
            })
        }

        if (options.distBetweenPoints > 0) {
            curves.push([]);

            let point = null;
            let distance = 0;
            do {
                distance += options.distBetweenPoints;
                point = lookup(distance);
                if (point != null) curves[0].push(point.approximation);
            } while (point != null);
        } else if (options.distBetweenPoints <= 0) {
            let totalDist = 0;
            for (let i = 1; i < this.state.positions.length; i++) {
                if (this.state.positions[i].type == FieldTypes.Points.Hard || i == this.state.positions.length - 1) {
                    for (let t = 0.01; t <= 1; t += (options.tIncrease || 0.01)) {
                        let x = 0;
                        let y = 0;
                        const n = softPoints.length + 2;

                        let derX = 0;
                        let derY = 0;

                        for (let j = 0; j < softPoints.length + 2; j++) {
                            const point = (j == 0 || j == softPoints.length + 1) ?
                                (j == 0 ? this.state.positions[lastHardPoint] : this.state.positions[i]) :
                                softPoints[j - 1];
                            const nextPoint = [this.state.positions[lastHardPoint], ...softPoints, this.state.positions[i]][j + 1];
                                                    
                            const lerpedValue = (index) => { 
                                return (fractorial(n - 1) / (fractorial(index) * fractorial(n - 1 - index))) * Math.pow(1 - t, n - 1 - index) * Math.pow(t, index)
                            };
                            
                            const calcValue = lerpedValue(j);

                            x += calcValue * point.x;
                            y += calcValue * point.y;
                            
                            if (j < softPoints.length + 1) {
                                //if (nextPoint == null) console.log(j, softPoints.length + 2);
                                const q = {
                                    x: (n + 1) * (nextPoint.x - point.x),
                                    y: (n + 1) * (nextPoint.y - point.y)
                                };
        
                                derX += q.x * lerpedValue(j - 1);
                                derY += q.y * lerpedValue(j - 1);
                            }
                        }

                        if (options.createList) {
                            curves[curves.length - 1].push({
                                x,
                                y
                            });
                            if (options.addDistances && curves[curves.length - 1].length > 1) {
                                let differenceBetweenThisAndLast = {
                                    x: x - curves[curves.length - 1][curves[curves.length - 1].length - 2].x,
                                    y: y - curves[curves.length - 1][curves[curves.length - 1].length - 2].y,
                                }
                                totalDist += Math.sqrt(Math.pow(differenceBetweenThisAndLast.x, 2) + Math.pow(differenceBetweenThisAndLast.y, 2));
                                curves[curves.length - 1][curves[curves.length - 1].length - 1]["distance"] = totalDist;
                            } else if (options.addDistances) {
                                curves[curves.length - 1][curves[curves.length - 1].length - 1]["distance"] = 0;
                            }
                        } else {
                            curves[curves.length - 1][t] = {
                                x,
                                y,
                            }
                            if (options.addDistances && Object.keys(curves[curves.length - 1]).length > 1) {
                                let differenceBetweenThisAndLast = {
                                    x: x - curves[curves.length - 1][t - options.tIncrease].x,
                                    y: y - curves[curves.length - 1][t - options.tIncrease].y,
                                }
                                totalDist += Math.sqrt(Math.pow(differenceBetweenThisAndLast.x, 2) + Math.pow(differenceBetweenThisAndLast.y, 2));
                                curves[curves.length - 1][t]["distance"] = totalDist;
                            }
                        }

                        derCurves[derCurves.length - 1].push({
                            x: derX,
                            y: derY
                        });
                    }

                    lastHardPoint = i;
                    softPoints = [];
                    curves.push([]);
                } else {
                    softPoints.push(this.state.positions[i]);
                }
            }
        }

        if (options.der) {
            return {curves, derCurves};
        }

        return curves;
    }

    generatePath(start=(this.state.positions.length > 0 ? this.state.positions[0] : {x:0,y:0}), skipHardPoints=-1, __verbose=false, returnInsteadOfSet=false) {
        console.time("generate path")

        const inchesToPixel = this.state.i2p;

        /**
         * This generates a series of points that the robot will follow by time.
         * This ignores any timeline objects. It is just a series of points plus a time.
         * Follows any restrictions outlined in the planning menu.
         */
        const pid = this.state.trajectorySettings.pid.copy();
        const maxVelocity = this.state.trajectorySettings.maxSpeed;
        const maxAcceleration = this.state.trajectorySettings.maxAccel;
        const minVelocity = this.state.trajectorySettings.minSpeed;

        let path = [];
        /**
         * Last point is added since the robot may be farther away from the goal than what was planned before.
         * This is to ensure that the robot will not overshoot the goal or undershoot it.
         */
        let lastPoint = start;

        //Change the list of positions 
        const positions = skipHardPoints >= 0 ? this.state.positions.slice(Math.min(skipHardPoints, this.state.positions.length - 2)) : [...this.state.positions];
        positions[0] = Object.assign({
            type: FieldTypes.Points.Hard
        }, start);

        positions[positions.length - 1].type = FieldTypes.Points.Hard; // Make sure the last point is a hard point

        const distBetween = 0.1; //this.state.trajectorySettings.minSpeed / 2; //new Unit(1, Unit.Type.INCHES).getcu(inchesToPixel);

        console.time("generate bezier curve for path")
        const currentPath = this.generateBezierCurve({
            distBetweenPoints: distBetween,
        })[0];
        console.timeEnd("generate bezier curve for path")
        //console.log(currentPath);

        let totalDistance = distBetween * currentPath.length;

        if (__verbose) console.log("Generating path: " + (totalDistance / inchesToPixel / 12) + " ft, least amount of time to move: " + (totalDistance / inchesToPixel / 12 / maxVelocity) + " s");
        
        let lastFewHardPoints = [
            {
                distance: 0,
                x: positions[0].x,
                y: positions[0].y,
                index: 0,
                curveIndx: -1
            }
        ]; //object w/ index of position and ~distance from start

        let nextHardPoint = {
            x: 0,
            y: 0,
            distance: 0
        }

        const findPointByDistance = (distanceInCurve=0, start=0, byDistance=false) => {
            let _distanceTracker = 0;
            for (let i = byDistance ? 0 : start; i < currentPath.length - 1; i++) {
                if (byDistance) {
                    if (currentPath[i].distance < start) {
                        _distanceTracker = currentPath[i].distance;
                        continue;
                    }
                }
                const differenceInDistances = currentPath[i].distance - _distanceTracker;
                if (distanceInCurve > _distanceTracker && distanceInCurve <= currentPath[i].distance) {
                    const percent = (distanceInCurve - _distanceTracker) / differenceInDistances;
                    return {
                        x: currentPath[i].x + (currentPath[i + 1].x - currentPath[i].x) * percent,
                        y: currentPath[i].y + (currentPath[i + 1].y - currentPath[i].y) * percent,
                        beforeIndex: i - 1,
                        afterIndex: i,
                    }
                }
                _distanceTracker = currentPath[i].distance;
            }

            return {
                x: currentPath[currentPath.length - 1].x,
                y: currentPath[currentPath.length - 1].y,
                beforeIndex: currentPath.length - 2,
                afterIndex: currentPath.length - 1,
            }
        }

        const findDistanceByPoint = (pointPosition={x:1,y:1}, start=1, byDistance=false, verbose=false) => {
            //The first hard point should be the first point in the curve (ish), so we can assume that to be dist 0
            const firstHardPoint = positions[0];
            const firstPointInCurve = currentPath[0];
            
            const firstBounds = {
                topLeft: {
                    x: Math.min(firstHardPoint.x, firstPointInCurve.x),
                    y: Math.min(firstHardPoint.y, firstPointInCurve.y),
                },
                bottomRight: {
                    x: Math.max(firstHardPoint.x, firstPointInCurve.x),
                    y: Math.max(firstHardPoint.y, firstPointInCurve.y),
                }
            }
            
            if (pointPosition.x >= firstBounds.topLeft.x && pointPosition.x <= firstBounds.bottomRight.x && pointPosition.y >= firstBounds.topLeft.y && pointPosition.y <= firstBounds.bottomRight.y) {
                //The point is in the first bounds, so we can assume that it is the first point in the curve
                return 0;
            }

            for (let i = byDistance ? 1 : start; i < currentPath.length; i++) {
                const lastPoint = currentPath[i - 1];
                const thisPoint = currentPath[i];

                if (thisPoint.distance < start && byDistance) continue;

                //create a bounds using the last point and this point
                const bounds = {
                    topLeft: {
                        x: Math.min(lastPoint.x, thisPoint.x),
                        y: Math.min(lastPoint.y, thisPoint.y),
                    },
                    bottomRight: {
                        x: Math.max(lastPoint.x, thisPoint.x),
                        y: Math.max(lastPoint.y, thisPoint.y),
                    }
                }

                if (verbose) {
                    //console.log("dist: ", dist(pointPosition.x, pointPosition.y, thisPoint.x, thisPoint.y));
                }

                //check if the point is between the current point and the next point
                if (pointPosition.x >= bounds.topLeft.x && pointPosition.x <= bounds.bottomRight.x && pointPosition.y >= bounds.topLeft.y && pointPosition.y <= bounds.bottomRight.y) {
                    const percent = (pointPosition.x - bounds.topLeft.x) / (bounds.bottomRight.x - bounds.topLeft.x);
                    return lastPoint.distance + (thisPoint.distance - lastPoint.distance) * percent;
                }

                const distTo = dist(pointPosition.x, pointPosition.y, thisPoint.x, thisPoint.y);

                if (distTo < distBetween) {
                    if (verbose) console.log("first method", pointPosition)
                    return thisPoint.distance;
                }
            }

            //If it couldn't find it though that, just find the closest point to it.
            let closestPoint = {
                distance: Infinity,
                index: -1,
            }
            for (let i = byDistance ? 0 : start; i < currentPath.length; i++) {
                if (currentPath[i].distance < start && byDistance) continue;

                const thisPoint = currentPath[i];
                const distTo = dist(pointPosition.x, pointPosition.y, thisPoint.x, thisPoint.y);
                if (distTo < closestPoint.distance) {
                    closestPoint.distance = distTo;
                    closestPoint.index = i;
                }
            }
            if (verbose) console.log("second method, " + closestPoint.index, currentPath[closestPoint.index])

            return currentPath[closestPoint.index].distance;
        }

        const findNextHardPoint = () => {
            let lastHardPoint = 0;
            for (let i = 0; i < positions.length; i++) {
                const containsDist = lastFewHardPoints.find((e) => {return e.index == i});
                const isCurrentPoint = dist(positions[i].x, positions[i].y, nextHardPoint.x, nextHardPoint.y) < 0.1;

                if (positions[i].type == FieldTypes.Points.Hard && containsDist == null && !isCurrentPoint) {
                    //skip if it's the default point
                    if (!(nextHardPoint.x == 0 && nextHardPoint.y == 0)) {
                        const distanceAlongPath = lastHardPoint == 0 ? 0 : findDistanceByPoint(nextHardPoint, lastFewHardPoints[lastFewHardPoints.length - 1].distance, true)

                        //console.log(Object.assign({}, nextHardPoint), Object.assign({}, lastFewHardPoints[lastFewHardPoints.length - 1]), distanceAlongPath)

                        //console.log("added to last " this.state.positions[i])
                        //Add the old hard point to the list of hard points.
                        lastFewHardPoints.push({
                            distance: distanceAlongPath,
                            x: nextHardPoint.x + 1 - 1,
                            y: nextHardPoint.y + 1 - 1,
                            index: lastHardPoint,
                            curveIndx: findPointByDistance(distanceAlongPath).beforeIndex,
                        });
                    }

                    nextHardPoint = {
                        x: positions[i].x,
                        y: positions[i].y,
                        distance: findDistanceByPoint(positions[i], lastFewHardPoints[lastFewHardPoints.length - 1], true),
                    }

                    //console.log("updated, ", lastFewHardPoints[lastFewHardPoints.length - 1], nextHardPoint);
                    return true;
                } else if (positions[i].type == FieldTypes.Points.Hard) {
                    lastHardPoint = i;
                }
            }
            return false;
        }

        const calcDistanceToNextHardPoint = (currentX, currentY, verbose=false) => {
            const lastHardPoint = lastFewHardPoints[lastFewHardPoints.length - 1];

            //console.log(lastHardPoint, lastFewHardPoints)

            let reachedCurrentPoint = false;
            let distTotal = 0;
            let lastDist = 0;
            let totalPathDist = 0;

            if (dist(currentX.x, currentY.y, positions[0].x, positions[0].y) < distBetween) {
                //The last hard point is the first point in the curve, so we can assume that the distance is 0
                reachedCurrentPoint = true;
                //console.log("found point, is first point")
            }

            for (let i = 0; i < currentPath.length; i++) {
                const approx = currentPath[i];

                totalPathDist += i > 0 ? dist(lastDist, 0, approx.x, approx.y) : 0;

                if (!reachedCurrentPoint) {                    
                    const distToFirst = dist(currentX, currentY, approx.x, approx.y);
                    if (verbose) {
                        if (distToFirst / 2 <= distBetween) {
                            console.log(i, lastHardPoint.curveIndx, currentPath.length, approx, currentX, currentY)
                            console.log(currentPath[lastHardPoint.curveIndx])
                        }
                    }

                    if (distToFirst / 2 <= distBetween && i >= lastHardPoint.curveIndx) {
                        reachedCurrentPoint = true;
                        if (verbose) {
                            console.log("!!!found point, " + totalPathDist + " px along path, ", approx, i)
                            console.log("!!!next point: ", nextHardPoint)
                        }
                        lastDist = approx.distance;
                    }
                } else {
                    const distToNext = dist(nextHardPoint.x, nextHardPoint.y, approx.x, approx.y);
                    const distMoved = approx.distance - lastDist;
                    lastDist = approx.distance;
                    distTotal += distMoved;
                    if (Math.abs(distToNext) / 2 <= distBetween && i > lastHardPoint.curveIndx) {
                        if (verbose) {
                            console.log("dist to next: " + distTotal, i);
                        }
                        return distTotal;
                    }
                }
            } 
            
            const lastPosPoint = positions[positions.length - 1]
            if (lastPosPoint.x == nextHardPoint.x && lastPosPoint.y == nextHardPoint.y) {
                return currentPath[currentPath.length - 1].distance;
            }

            //Just calculate the closest point to the hard pointk
    
            let closestStart__ = {
                distance: Infinity,
                index: -1,
            }
            for (let i = 0; i < currentPath.length; i++) {
                const thisPoint = currentPath[i];
                const distTo = dist(currentX, currentY, thisPoint.x, thisPoint.y);
                if (distTo < closestStart__.distance) {
                    closestStart__.distance = distTo;
                    closestStart__.index = i;
                }// else console.log(distTo)
            }

            let closestNextHardPoint__ = {
                distance: Infinity,
                index: -1,
            }
            for (let j = closestStart__.index; j < currentPath.length; j++) {
                const thisPoint = currentPath[j];
                const distTo = dist(nextHardPoint.x, nextHardPoint.y, thisPoint.x, thisPoint.y);
                if (distTo < closestNextHardPoint__.distance) {
                    closestNextHardPoint__.distance = distTo;
                    closestNextHardPoint__.index = j;
                }
            }

            return currentPath[closestNextHardPoint__.index].distance;
        }
        
        findNextHardPoint();
        if (__verbose) console.log("found next hard point at ", nextHardPoint)

        let currentRobotPos = {
            x: lastPoint.x,
            y: lastPoint.y
        }

        let distToNext = 0;
        let distanceTracker = 0;
        let _lastDistanceTracker = 0;

        pid.reset();

        if (__verbose) {
            console.log("starting at: ", currentRobotPos)
            console.log([...lastFewHardPoints])
        }

        let prog = 0;
        let lastVelocity = 0;
        do {
            //Calculate how far the next hard point is
            distToNext = calcDistanceToNextHardPoint(currentRobotPos.x, currentRobotPos.y);

            //console.log(distToNext)

            //If it couldn't find that hard point, then we can assume that we've moved past it.
            if (distToNext == -1 || distToNext == Infinity || isNaN(distToNext) || distToNext <= distBetween + 0.1 || nextHardPoint.distance - distanceTracker < 0) {
                if (__verbose) console.log("final dist before moving to next hard point: ", distToNext)
                //Update and find the next hard point. If the next hard point exists, just calculate the distance to it.
                if (findNextHardPoint()) {
                    //Calculate the next distance to the next hard point.
                    distToNext = calcDistanceToNextHardPoint(currentRobotPos.x, currentRobotPos.y, false);
                    pid.reset();

                    if (__verbose) {
                        console.log("next_point", "reached hard point, moving to next hard point ", nextHardPoint, distToNext)
                        console.log("next_point", lastFewHardPoints)
                    }
                } else {
                    if (__verbose) {
                        console.log("believe i finished the path! ")
                    }
                    break;
                }
            }

            //Find where the robot is about located on the bézier curve.
            const pointOnCurve = prog == 0 ? 0 : findDistanceByPoint(currentRobotPos, distanceTracker, true);

            //Find hard point by point on curve
            const hardPointByCurve = findDistanceByPoint(nextHardPoint, lastFewHardPoints.length > 0 ? lastFewHardPoints[lastFewHardPoints.length - 1].distance : 0, true);

            //console.log("currently at ", pointOnCurve, " hard point: ", hardPointByCurve)

            /**
             * Usually, it may be better to do simple movement. But we want our robot to be able to move on the course.
             * If we get just the x,y of how it should move according to the plant, then the robot would move directly towards it.
             * Rather, if we convert the bézier curve to a line graph, we can plug that through the PID and get a movement that follows the path.
             */
            let movement = pid.getSimpleMovement(hardPointByCurve, pointOnCurve, __verbose)

            if (movement < 0 && __verbose) {
                console.log("movement is negative, ", movement, "going to: ", hardPointByCurve, "currently at: ", pointOnCurve)
                console.log(lastFewHardPoints.length > 0 ? lastFewHardPoints[lastFewHardPoints.length - 1].distance : 0)
                console.log("predist: " + findDistanceByPoint(nextHardPoint, lastFewHardPoints.length > 0 ? lastFewHardPoints[lastFewHardPoints.length - 1].distance : 0, true, true))
                break;
            }

            if (__verbose) {
                console.log("pid input ", hardPointByCurve, pointOnCurve)
                console.log("movement: " + movement + ", total dist: " + (pointOnCurve + movement) + ", goal: " + distToNext)
            }

            const lastPosPoint = positions[positions.length - 1]

            //Make sure that the movement follows the bounds.
            if (movement / this.state.trajectorySettings.deltaTime < minVelocity) {
                if (!prettyMuchSamePoint(lastPosPoint, nextHardPoint)) {
                    if (__verbose) console.log("was lower than min velocity, setting to min velocity")
                    movement = minVelocity * this.state.trajectorySettings.deltaTime;
                }
                //pid.reset();
            } else if (movement / this.state.trajectorySettings.deltaTime > maxVelocity) {
                if (__verbose) console.log("was higher than max velocity")
                movement = maxVelocity * this.state.trajectorySettings.deltaTime;
                //pid.reset();
            }

            // if (Math.abs((movement / this.state.trajectorySettings.deltaTime) - lastVelocity) > maxAcceleration) {
            //     if (__verbose) console.log("was higher than max acceleration")
            //     movement = (maxAcceleration) * this.state.trajectorySettings.deltaTime;
            // }

            _lastDistanceTracker = distanceTracker + 1 - 1;
            lastVelocity = movement / this.state.trajectorySettings.deltaTime;

            //Find the point on the bezier curve that the robot should be at.
            const pointOnBezier = findPointByDistance(pointOnCurve + movement, pointOnCurve, true);

            distanceTracker = pointOnCurve + movement;

            if (__verbose) console.log("current point ", pointOnBezier)

            //Update the current robot position.
            currentRobotPos = {
                x: pointOnBezier.x,
                y: pointOnBezier.y,
            }

            path.push(Object.assign({
                distance: distanceTracker
            }, pointOnBezier));

            prog++;

            if (__verbose) console.log("********")

            let finished = false;

            if (prettyMuchSamePoint(lastPosPoint, nextHardPoint) || isNaN(movement)) {
                if (dist(currentRobotPos.x, currentRobotPos.y, lastPosPoint.x, lastPosPoint.y) <= distBetween * 2) {
                    finished = true;
                    if (__verbose) console.log("pretty close")
                }
            } else if (pointOnBezier.afterIndex == currentPath.length - 1) {
                finished = true;
                if (__verbose) console.log("after index")
            }

            if (finished) {
                if (__verbose) console.log("finished path! was pretty close to the final point.")
                break;
            }

            //console.log("current robot pos, ", currentRobotPos, ", dist away: ", distToNext, " movement was: " + movement)
        } while (distToNext > -1 && prog < currentPath.length * 5);

        if (__verbose) {
            console.log("------------")
            console.log("prog: " + prog + "(out of a possible " + currentPath.length * 5 + ")");
            console.log("current robot pos, ", currentRobotPos, ", dist away: ", distToNext)
        }

        for (let i = 0; i < lastFewHardPoints.length; i++) {
            path.push(Object.assign({hard: true}, lastFewHardPoints[i]));
        }

        path.push(Object.assign({hard: true}, nextHardPoint));

        console.timeEnd("generate path")

        if (!returnInsteadOfSet) {
            this.state.trajectorySettings.generatedPIDTrajectory = path;

            for (let event of this.state.timeline.events) {
                if (event.type == FieldTypes.Timeline.Drive) {
                    //just edit duration to according to length of traj path.
                    event.end = event.start + (path.length * this.state.trajectorySettings.deltaTime);
                }
            } 
        } else {
            return path;
        }
    }

    generateTimeline(aprilTagData=[], occuringAtTime=0) {
        console.log("starting to generate timelime")
        console.time("generate timeline")

        const isDriving = (currentEvents=[]) => {
            const filtered = currentEvents.filter((event) => event.type == FieldTypes.Timeline.Drive);
            return filtered.length > 0;
        }

        const i2p = this.state.i2p;
        
        //TODO: Calculate point from april tags
        const currentPoint = this.state.positions[0];

        const path = this.generatePath(currentPoint, -1, false, true).filter((point) => !Object.keys(point).includes("hard"));
 
        let timeline = [];

        const time = this.state.trajectorySettings.time;
        const deltaTime = this.state.trajectorySettings.deltaTime;

        let driving = false;
        let drivingPoints = 0;
        
        let lastPoint = {
            x: new Unit(currentPoint.x / i2p, Unit.Type.INCHES),
            y: new Unit(currentPoint.y / i2p, Unit.Type.INCHES),
        };

        let rotationEvents = this.state.positionEvents.filter(e => e.type == PositionEvent.Type.Rotation);

        let rotationEventsOnPID = [];

        for (let rotationEvent of rotationEvents) {
            let closestPoint = {x: 0, y: 0, distance: 0, index: -1}
            let closestDistance = 9999999;

            for (let i = 0; i < path.length; i++) {
                const distFromRotationEvent = dist(rotationEvent.x, rotationEvent.y, path[i].x, path[i].y)
                if (distFromRotationEvent < closestDistance) {
                    closestPoint = {
                        x: path[i].x,
                        y: path[i].y,
                        distance: path[i].distance,
                        index: i
                    }
                    closestDistance = distFromRotationEvent;
                }
            }

            rotationEventsOnPID.push(Object.assign({
                reference: rotationEvent
            }, closestPoint))
        }

        rotationEventsOnPID = rotationEventsOnPID.sort((a, b) => a.distance - b.distance)

        let lastAngle = 0;

        for (let t = 0; t <= this.state.trajectorySettings.time; t += deltaTime) {
            const currentEvents = this.state.timeline.events.filter(event => (event.start <= t && event.end >= t));
            const drivingStateChanged = driving == isDriving(currentEvents);
            driving = isDriving(currentEvents);
            if (typeof lastPoint.x == "object") {
                timeline.push([
                    {
                        type: FieldTypes.Timeline.GeneralTime,
                        time: t,
                        data: {
                            time: t,
                            driving,
                            position: {
                                x: new Unit(lastPoint.x.get(Unit.Type.INCHES) + 1 - 1, Unit.Type.INCHES),
                                y: new Unit(lastPoint.y.get(Unit.Type.INCHES) + 1 - 1, Unit.Type.INCHES),
                            }
                        }
                    }
                ]);
            } else {
                timeline.push([
                    {
                        type: FieldTypes.Timeline.GeneralTime,
                        time: t,
                        data: {
                            time: t,
                            driving,
                            position: {
                                x: new Unit(lastPoint.x / i2p + 1 - 1, Unit.Type.INCHES),
                                y: new Unit(lastPoint.y / i2p + 1 - 1, Unit.Type.INCHES),
                            }
                        }
                    }
                ]);
            }

            if (drivingStateChanged) {
                if (driving && drivingPoints < path.length) {
                    const newCurrentPoint = path[drivingPoints];

                    timeline[timeline.length - 1][0].data.position = {
                        x: new Unit(newCurrentPoint.x / i2p, Unit.Type.INCHES),
                        y: new Unit(newCurrentPoint.y / i2p, Unit.Type.INCHES),
                    }
                    
                    let angle = new Angle(Math.atan2(newCurrentPoint.y - lastPoint.y, newCurrentPoint.y - lastPoint.y), Angle.Radians);

                    if (rotationEvents.length > 0) {
                        if (rotationEvents.length == 1) {
                            angle = rotationEvents[0].data.rotation.get(Angle.Radians)
                        } else {
                            if (newCurrentPoint.distance <= rotationEventsOnPID[0].distance) {
                                angle = rotationEventsOnPID[0].reference.data.rotation.get(Angle.Radians)
                            } else if (newCurrentPoint.distance >= rotationEventsOnPID[rotationEventsOnPID.length - 1].distance) {
                                angle = rotationEventsOnPID[rotationEventsOnPID.length - 1].reference.data.rotation.get(Angle.Radians)
                            } else {
                                let beforePoint = null;
                                let afterPoint = null;
                                
                                for (let i = 0; i < rotationEventsOnPID.length - 1; i++) {
                                    if (rotationEventsOnPID[i].distance <= newCurrentPoint.distance) {
                                        if (rotationEventsOnPID[i + 1].distance >= newCurrentPoint.distance) {
                                            beforePoint = rotationEventsOnPID[i];
                                            afterPoint = rotationEventsOnPID[i + 1];
                                        }
                                    }
                                }

                                if (beforePoint == null || afterPoint == null) {
                                    angle = lastAngle;
                                } else {
                                    let endRelativeDistance = afterPoint.distance - beforePoint.distance;
                                    let relativeCurrentDistance = newCurrentPoint.distance  - beforePoint.distance;
                                    let percentThrough = relativeCurrentDistance / endRelativeDistance;

                                    let angles = [beforePoint.reference.data.rotation.get(Angle.Radians), afterPoint.reference.data.rotation.get(Angle.Radians)]
                                    let differences = [angles[0] - angles[1], angles[1] - angles[0]]

                                    for (let i = 0; i < differences.length; i++) {
                                        if (differences[i] > 360) {
                                            differences[i] -= 360;
                                        } else if (differences[i] < 0) {
                                            differences[i] += 360;
                                        }
                                    }

                                    if (differences[0] < differences[1]) {
                                        angle = angles[0] - (differences[0] * percentThrough);
                                    } else {
                                        angle = angles[0] + (differences[1] * percentThrough)
                                    }

                                    if (angle < 0) {
                                        angle += 360;
                                    } else if (angle > 360) {
                                        angle -= 360;
                                    }
                                    
                                }
                            }
                        }
                    }

                    //start driving
                    timeline[timeline.length - 1].push({
                        type: FieldTypes.Timeline.Drive,
                        time: t,
                        data: {
                            x: new Unit(newCurrentPoint.x / i2p, Unit.Type.INCHES),
                            y: new Unit(newCurrentPoint.y / i2p, Unit.Type.INCHES),
                            velocity: dist(lastPoint.x, lastPoint.y, newCurrentPoint.x, newCurrentPoint.y) / i2p / deltaTime,
                            angle
                        }
                    })

                    lastPoint = newCurrentPoint;
                    lastAngle = angle;

                    drivingPoints++;
                }
            }
        }

        this.state.timeline.generated = timeline;
        console.timeEnd("generate timeline")
        console.log("finished generating timeline")

        return timeline;
    }

    loadFileAndCreateLastHardPoint() {
        if (!(!!window.PathFileLoader)) return;

        window.PathFileLoader.loadFile((PFL) => {
            const positions = PFL.positions;

            const lastPoint = positions[positions.length - 1];

            this.addPosition({
                x: lastPoint.x,
                y: lastPoint.y,
                type: FieldTypes.Points.Hard
            })
        });
    }
}

export default PathPlanner;