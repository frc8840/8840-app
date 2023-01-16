import { NeuralNetwork, Activation } from "../../ai/nn.js";
import dist from "../../misc/dist.js";
import { random, probability } from "../../misc/probability.js";
import { Angle, Unit } from "../../misc/unit.js";
import { float2 } from "../../raycasting/float.js";
import { circleSignedDistance, rectangleSignedDistance } from "../../raycasting/signed.js";

import { Ball, Physical } from "../PlayObj.js";

const dimensions = {
    width: new Unit(30, Unit.Type.INCHES),
    length: new Unit(30, Unit.Type.INCHES)
}

window.visualRaycasting = false;

window.generatePlayerID = (function*() {
    let id = 0;
    while (true) {
        yield id++;
    }
})();

class Player {
    static Team = {
        BLUE: 0,
        RED: 1
    }

    static summon(playerStartManager) {
        let players = [];

        const positions = playerStartManager.returnPositions();
        
        for (let bluePlayer of positions.blue) {
            players.push(new Player(bluePlayer, 0));
        }

        for (let redPlayer of positions.red) {
            players.push(new Player(redPlayer, 1));
        }

        return players;
    }

    constructor(position={x: 0, y: 0}, team=0) {
        this.pos = position;
        this.rotation = new Angle(0, Angle.Radians);

        this.velocity = {
            direction: new Angle(0, Angle.Radians),
            strength: 0,
        }

        this.team = team;

        this.nn = null;

        let width = dimensions.width.get(Unit.Type.INCHES)
        let length = dimensions.length.get(Unit.Type.INCHES)

        const percentageOffset = 0.95;

        //sensor is relative to robot, in inches.
        this.sensorPos = {
            front: {
                1: {x: (width / 2) * percentageOffset, y: (length / 2)},
                2: {x: -(width / 2) * percentageOffset, y: (length / 2)},
            },
            back: {
                1: {x: (width / 2) * percentageOffset, y: -(length / 2)},
                2: {x: -(width / 2) * percentageOffset, y: -(length / 2)},
            },
            left: {
                1: {x: -(width / 2), y: (length / 2) * percentageOffset},
                2: {x: -(width / 2), y: -(length / 2) * percentageOffset},
            },
            right: {
                1: {x: (width / 2), y: (length / 2) * percentageOffset},
                2: {x: (width / 2), y: -(length / 2) * percentageOffset},
            },
        }
    } 

    update() {

    }

    draw(ctx, i2p) {
        //Draw rectangle at robot position
        ctx.save();

        let width = dimensions.width.getcu(i2p, Unit.Type.INCHES)
        let length = dimensions.length.getcu(i2p, Unit.Type.INCHES)

        ctx.translate(this.pos.x, this.pos.y);
        ctx.rotate(this.rotation.get(Angle.Radians));

        ctx.fillStyle = this.team == 0 ? "blue" : "red";
        ctx.strokeStyle = "black";

        ctx.fillRect(-width / 2,-length / 2, width, length)
        ctx.strokeRect(-width / 2,-length / 2, width, length)

        //Draw sensors
        for (let sensor of Object.values(this.sensorPos)) {
            for (let side of Object.values(sensor)) {
                ctx.beginPath();
                ctx.arc((side.x * i2p), (side.y * i2p), 3, 0, 2 * Math.PI);
                ctx.stroke();
            }
        }

        ctx.restore();

        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, 5, 0, 2 * Math.PI);
        ctx.stroke();

        //Draw small front line
        ctx.beginPath();
        ctx.moveTo(this.pos.x, this.pos.y);
        ctx.lineTo(this.pos.x + (Math.cos(this.rotation.get(Angle.Radians) + Math.PI/2) * 10), this.pos.y + (Math.sin(this.rotation.get(Angle.Radians) + Math.PI/2) * 10));
        ctx.stroke();
    }
}

/**
 * These are the capabilities of our robot in rapid react.
 * Since i'm lazy tho, it'll be the same robot that we did but w/ swerve drive
 */
const rapidReactCapabilities = {
    canMove: true,
    canRotate: true,
    canShootLow: true,
    canShootHigh: true,
    canShootFromDistance: false,
    canClimb: true,
    canClimbTo: 1
}

class RapidReactPlayer extends Player {
    static spawningProbabilites = {
        canMove: probability(1), //Certainly can move
        canRotate: probability(1), //Certainly can rotate
        canShootLow: probability(0.95), //Most likely can shoot a ball low
        canShootHigh: probability(0.5), //Half likely can shoot a ball high
        canShootFromDistance: (canShootLow=false, canShootHigh=false) => {
            if (canShootLow && !canShootHigh) {
                return probability(0.05) //Very unlikely to shoot from distance
            } else if (canShootLow && canShootHigh) {
                return probability(0.7) //Most likely to shoot from a distance
            } else if (!canShootLow && canShootHigh) {
                return probability(0.95) //Most likely to shoot from a distance
            } else {
                return probability(0) //Certainly can't shoot from a distance
            }
        },
        canClimb: (canShootLow=false, canShootHigh=false) => {
            /**
             * If the robot can shoot a ball from far, it's most likely able to climb
             * If only low, then it's only 70% likely to climb
             * If it can't do either, then it's most likely able to climb
             */
            if (canShootLow && !canShootHigh) {
                return probability(0.7)
            }
            return probability(0.95)
        },
    }

    static summon(playerStartManager, hasTeamAI=false) {
        let players = [];

        const positions = playerStartManager.returnPositions();
        
        for (let bluePlayer of positions.blue) {
            players.push(new RapidReactPlayer(bluePlayer, 0));
        }

        for (let redPlayer of positions.red) {
            players.push(new RapidReactPlayer(redPlayer, 1));
        }

        if (hasTeamAI) {
            players[random(players.length)].toCapabilitiesOfRobot();
            players[random(players.length)].isAi = true;
        }

        return players;
    }

    static Roles = {
        Shooter: 1,
        Defender: 2,
    }

    constructor(position={x: 0, y: 0}, team=0) {
        super(position, team);

        /**
         * Input nodes:
         * 1: X position (0-1)
         * 2: Y position (0-1)
         * 3: Front sensor 1
         * 4: Front sensor 2
         * 5: Back sensor 1
         * 6: Back sensor 2
         * 7: Left sensor 1
         * 8: Left sensor 2
         * 9: Right sensor 1
         * 10: Right sensor 2
         * 11: Distance to closest (team) ball
         * 12: Distance to closest (enemy) ball
         * 13: Distance to closest (team) player
         * 14: Distance to closest (enemy) player
         */

        /**
         * Output nodes:
         * 1: Forward
         * 2: Backward
         * 3: Left
         * 4: Right
         */

        this.nn = new NeuralNetwork(
            14, //Input ndoes
            [14, 14, 10, 10, 8], //Hidden nodes/layers
            4, //Output nodes
            0.01, //Learning rate
            Activation().sigmoid
        );

        //Capabilities
        this.canShootLow = RapidReactPlayer.spawningProbabilites.canShootLow.predict();
        this.canShootHigh = RapidReactPlayer.spawningProbabilites.canShootHigh.predict();

        this.canShootFromDistance = RapidReactPlayer.spawningProbabilites.canShootFromDistance(this.canShootLow, this.canShootHigh).predict();
        
        this.canClimb = RapidReactPlayer.spawningProbabilites.canClimb(this.canShootLow, this.canShootHigh).predict();

        this.canClimbTo = this.canClimb ? random(1, 4) : 0;

        this.canMove = RapidReactPlayer.spawningProbabilites.canMove.predict();
        this.canRotate = RapidReactPlayer.spawningProbabilites.canRotate.predict();

        this.isAi = false;

        //This is for if it's not an AI, so it knows what to prioritize
        this.role = this.canShootHigh ? "shooter" : (probability(0.5).predict() ? "defender" : "shooter"); //Can be "shooter", or "defender"

        //Inventory
        this.inventory = {
            balls: [],
        }

        this.id = window.generatePlayerID.next().value;
    }

    toCapabilitiesOfRobot(capabilites = null) {
        for (let [key, value] of Object.entries(capabilites === null ? rapidReactCapabilities : capabilites)) {
            this[key] = value;
        }
    }

    update(ctx, i2p, physicsObjects, players) {
        const fieldBalls = physicsObjects.filter(obj => obj instanceof Ball);

        //this.rotation = new Angle(this.rotation.get(Angle.Degrees) + 1, Angle.Degrees);

        const blueBalls = fieldBalls.filter(ball => ball.color == "blue");
        const redBalls = fieldBalls.filter(ball => ball.color == "red");

        const enemyPlayers = players.filter(player => player.team != this.team);
        const teamPlayers = players.filter(player => player.team == this.team && player != this);

        let teamBalls = this.team == Player.Team.BLUE ? blueBalls : redBalls;
        let enemyBalls = this.team == Player.Team.BLUE ? redBalls : blueBalls;

        //Find closest team ball
        let closestTeamBalls = [];
        let closestTeamBallDistance = Infinity;
        for (let ball of teamBalls) {
            let distance = dist(this.pos.x, this.pos.y, ball.pos.x, ball.pos.y)
            if (distance < closestTeamBallDistance) {
                closestTeamBallDistance = distance;
            }
            closestTeamBalls.push({ball, distance})
        }
        closestTeamBalls.sort((a, b) => a.distance - b.distance)

        //Find closest enemy player
        let closestEnemyPlayers = [];
        let closestEnemyPlayerDistance = Infinity;
        for (let player of enemyPlayers) {
            let distance = dist(player.pos.x, player.pos.y, this.pos.x, this.pos.y);
            if (distance < closestEnemyPlayerDistance) {
                closestEnemyPlayerDistance = distance;
            }
            closestEnemyPlayers.push({player, distance})
        }
        closestEnemyPlayers.sort((a, b) => a.distance - b.distance)

        //Find closest enemy ball
        let closestEnemyBalls = [];
        let closestEnemyBallDistance = Infinity;
        for (let ball of enemyBalls) {
            let distance = dist(this.pos.x, this.pos.y, ball.pos.x, ball.pos.y)
            if (distance < closestEnemyBallDistance) {
                closestEnemyBallDistance = distance;
            }
            closestEnemyBalls.push({ball, distance})
        }
        closestEnemyBalls.sort((a, b) => a.distance - b.distance)

        //Find closest team player
        let closestTeamPlayers = [];
        let closestTeamPlayerDistance = Infinity;
        for (let player of teamPlayers) {
            let distance = dist(player.pos.x, player.pos.y, this.pos.x, this.pos.y);
            if (distance < closestEnemyPlayerDistance) {
                closestTeamPlayerDistance = distance;
            }
            closestTeamPlayers.push({player, distance})
        }
        closestTeamPlayers.sort((a, b) => a.distance - b.distance)

        if (this.isAi) {
            //use raymarching to find sensor values
            let sensorValues = {
                front: {1: 0, 2: 0, rotation: new Angle(0, Angle.Degrees), color: "#f5cc5b"}, //yellow
                back: {1: 0, 2: 0, rotation: new Angle(180, Angle.Degrees), color: "#1fbd1c"}, //green
                left: {1: 0, 2: 0, rotation: new Angle(90, Angle.Degrees), color: "#2a74a8"}, //blue 
                right: {1: 0, 2: 0, rotation: new Angle(270, Angle.Degrees), color: "#bf2e9b"}, //pink
            };

            let si = 0;

            // if (!Object.keys(window).includes("maxDist")) {
            //     window.maxDist = 0;
            // }

            // window.maxDist += 0.001;
            //const maxDistance = Math.sin(window.maxDist + (Math.PI / 2 * si)) * 100 + 100;

            const maxDistance = 100;

            for (let sensor of Object.keys(this.sensorPos)) {
                si++;
                for (let side of Object.keys(this.sensorPos[sensor])) {
                    let relativeStartToRobot = this.sensorPos[sensor][side];

                    let direction = sensorValues[sensor].rotation.get(Angle.Radians) + this.rotation.get(Angle.Radians) + Math.PI/2

                    //rotate relativeStart by this.rotation
                    let start = float2(this.pos.x + (Math.cos(this.rotation.get(Angle.Radians)) * relativeStartToRobot.x) - (Math.sin(this.rotation.get(Angle.Radians)) * relativeStartToRobot.y), this.pos.y + (Math.sin(this.rotation.get(Angle.Radians)) * relativeStartToRobot.x) + (Math.cos(this.rotation.get(Angle.Radians)) * relativeStartToRobot.y));

                    let end = float2(start.x + (Math.cos(direction) * maxDistance), start.y + (Math.sin(direction) * maxDistance));

                    let closestDistance = 0;
                    let totalDistance = 0;
                    let currentPos = start;
                    let t = 0;
                    do {
                        if (t > 0) {
                            totalDistance += closestDistance * 0.25;

                            //Update currentPos by adding the totalDistance in direction
                            currentPos = float2(currentPos.x + Math.cos(direction) * closestDistance, currentPos.y + Math.sin(direction) * closestDistance);

                            if (totalDistance > maxDistance || dist(currentPos.x, currentPos.y, start.x, start.y) > maxDistance) {
                                totalDistance = maxDistance;
                                closestDistance = 100;
                                currentPos = float2(start.x + Math.cos(direction) * totalDistance, start.y + Math.sin(direction) * totalDistance);
                                break;
                            }
                        }

                        closestDistance = 999999;

                        physicsObjects.forEach(obj => {
                            let dist = 999999;

                            if (obj.type == Physical.Type.CIRCLE) {
                                dist = circleSignedDistance(obj.pos.x, obj.pos.y, obj.radius, currentPos.x, currentPos.y);
                                //console.log(dist, obj.pos.x, obj.pos.y, obj.radius, currentPos.x, currentPos.y)
                            } else if (obj.type == Physical.Type.RECTANGLE) {
                                dist = rectangleSignedDistance(obj.pos.x, obj.pos.y, obj.size.w, obj.size.h, obj.rotation, currentPos.x, currentPos.y);
                                //console.log(obj.pos.x, obj.pos.y, obj.size.w, obj.size.h, obj.rotation, currentPos.x, currentPos.y)
                            }

                            if (dist < closestDistance) {
                                closestDistance = dist;
                            }
                        })

                        ctx.strokeStyle = "black";

                        //console.log(closestDistance)

                        if (closestDistance < 1000 && closestDistance > 0 && window.visualRaycasting) {
                            ctx.strokeStyle = sensorValues[sensor].color;
                            //Draw ray
                            ctx.beginPath();
                            ctx.arc(currentPos.x, currentPos.y, closestDistance, 0, 2 * Math.PI);
                            ctx.stroke();
                        }

                        t++;

                    } while (closestDistance > 1 && t < 30);

                    sensorValues[sensor][side] = Math.min(maxDistance, totalDistance) /// start.dist(end);

                    ctx.fillStyle ="black"
                    ctx.strokeStyle = "black";

                    if (sensorValues[sensor][side] >= maxDistance) {
                        currentPos = end;
                    }

                    ctx.fillStyle = sensorValues[sensor].color;

                    if (window.visualRaycasting) {
                        //draw at end
                        ctx.beginPath();
                        ctx.arc(end.x, end.y, 5, 0, 2 * Math.PI);
                        ctx.stroke();
                        ctx.fill();

                        //draw line
                        ctx.beginPath();
                        ctx.moveTo(start.x, start.y);
                        ctx.lineTo(end.x, end.y);
                        ctx.stroke();

                        ctx.beginPath();
                        ctx.arc(start.x, start.y, 5, 0, 2 * Math.PI);
                        ctx.fill();
                    }

                    ctx.fillStyle = "black";

                    //DRAW at ray end
                    ctx.beginPath();
                    ctx.arc(currentPos.x, currentPos.y, 5, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.fill();
                }

                //console.log(sensorValues)
            }

            const input = [
                this.pos.x / ctx.canvas.width,
                this.pos.y / ctx.canvas.height,
                sensorValues["front"][1] / maxDistance,
                sensorValues["front"][2] / maxDistance,
                sensorValues["back"][1] / maxDistance,
                sensorValues["back"][2] / maxDistance,
                sensorValues["left"][1] / maxDistance,
                sensorValues["left"][2] / maxDistance,
                sensorValues["right"][1] / maxDistance,
                sensorValues["right"][2] / maxDistance,
                Math.min(1, closestTeamBallDistance / maxDistance),
                Math.min(1, closestEnemyBallDistance / maxDistance),
                Math.min(1, closestTeamPlayerDistance / maxDistance),
                Math.min(1, closestEnemyPlayerDistance / maxDistance)
            ];

            const output = this.nn.feedforward(input)

            /**
             * Output nodes:
             * 1: Forward
             * 2: Backward
             * 3: Left
             * 4: Right
             */
            const outputNames = [
                "Forward",
                "Backward",
                "Left",
                "Right",
            ]

            const direction = outputNames[output.indexOf([...output].sort((a, b) => b - a)[0])];

            let relativeAngle = 0;

            switch (direction) {
                case "Forward":
                case "Backward":
                case "Left":
                case "Right":
                default:
                    break;
            }

            //console.log(output, )
        } else {

            const onLeftSideOfField = (r) => r.pos.x < ctx.canvas.width * .4;
            const onRightSideOfField = (r) => r.pos.x > ctx.canvas.width * .6;
            const inMiddle = (r) => !onLeftSideOfField(r) && !onRightSideOfField(r);

            const onTopHalf = (r) => r.pos.y > ctx.canvas.height * .5;
            const onBottomHalf = (r) => !onTopHalf(r);

            if (this.role == RapidReactPlayer.Roles.Defender) {
                /**
                 * As a defender, the priority is hitting ther players.
                 * Since I'm lazy and don't want to do too much more physics,
                 * we'll say in some other code that when an player is touching their enemy,
                 * their enemy has less acuracy, based on when they last hit.
                 * Plus, they move sort of in the direction of what that robot is moving.
                 * 
                 * That's more in a different bit of code though, so here we'll add that
                 * the defender robot prioritizes going after the shooters.
                 * */
                const closestShooters = closestEnemyPlayers.filter((a) => a.player.role == RapidReactPlayer.Roles.Shooter);

                if (closestShooters.length > 0) {
                    
                }
            }

            if (onLeftSideOfField(this)) {
                
            }

        }
    }
}

class ChargedUpPlayer extends Player {
    static spawningProbabilites = {
        
    }

    static GamePiece = {
        Cone: "Cone",
        
    }

    static summon(playerStartManager, hasTeamAI=false) {
        let players = [];

        const positions = playerStartManager.returnPositions();
        
        for (let bluePlayer of positions.blue) {
            players.push(new ChargedUpPlayer(bluePlayer, 0));
        }

        for (let redPlayer of positions.red) {
            players.push(new ChargedUpPlayer(redPlayer, 1));
        }

        if (hasTeamAI) {
            players[random(players.length)].toCapabilitiesOfRobot();
            players[random(players.length)].isAi = true;
        }

        return players;
    }

    static Roles = {
        Defender: "Defender",
        Delivery: "Delivery",
    }

    constructor(position={x: 0, y: 0}, team=0) {
        super(position, team);

        //TODO: Figure out input nodes.
        /**
         * Input nodes:
         * 1: X position (0-1)
         * 2: Y position (0-1)
         * 3: Front sensor 1
         * 4: Front sensor 2
         * 5: Back sensor 1
         * 6: Back sensor 2
         * 7: Left sensor 1
         * 8: Left sensor 2
         * 9: Right sensor 1
         * 10: Right sensor 2
         * 11: 
         */

        /**
         * Output nodes:
         * 1: Forward
         * 2: Backward
         * 3: Left
         * 4: Right
         */

        this.nn = new NeuralNetwork(
            14, //Input ndoes
            [14, 14, 10, 10, 8], //Hidden nodes/layers
            4, //Output nodes
            0.01, //Learning rate
            Activation().sigmoid
        );

        //Capabilities
        this.canMove = true;
        this.canRotate = true;

        this.isAi = false;

        //This is for if it's not an AI, so it knows what to prioritize
        this.role = ChargedUpPlayer.Roles.Defender;

        //Inventory
        this.inventory = {
            gamePiece: null,
        }

        this.id = window.generatePlayerID.next().value;
    }

    toCapabilitiesOfRobot(capabilites = null) {
        for (let [key, value] of Object.entries(capabilites === null ? rapidReactCapabilities : capabilites)) {
            this[key] = value;
        }
    }

    update(ctx, i2p, physicsObjects, players) {
        //TODO: fix and make
    }
}

export default RapidReactPlayer;

export { dimensions };