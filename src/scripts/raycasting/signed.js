import { Angle } from "../misc/unit";
import { float2, float3, translate, rotate } from "./float";
import dist from "../misc/dist"


/*
FROM: https://gamedev.stackexchange.com/questions/86420/how-do-i-calculate-the-distance-between-a-point-and-a-rotated-rectangle

relx = x-cx
rely = y-cy
rotx = relx*cos(-theta) - rely*sin(-theta)
roty = relx*sin(-theta) + rely*cos(-theta)
dx = max(abs(rotx) - width / 2, 0);
dy = max(abs(roty) - height / 2, 0);
return dx * dx + dy * dy;
 */

function rectangleSignedDistance(rectangleX, rectangleY, width, height, rectangleRotation=new Angle(0, Angle.Radians), fromX, fromY) {
    let c = float2(rectangleX, rectangleY);
    let p = float2(fromX, fromY);
    let theta = typeof rectangleRotation == 'object' ? rectangleRotation.get(Angle.Radians) : rectangleRotation;

    let rel = float2(p.x - c.x, p.y - c.y);
    let rot = float2(rel.x * Math.cos(-theta) - rel.y * Math.sin(-theta), rel.x * Math.sin(-theta) + rel.y * Math.cos(-theta));
    let d = float2(Math.max(Math.abs(rot.x) - width / 2, 0), Math.max(Math.abs(rot.y) - height / 2, 0));

    return Math.sqrt(d.x * d.x + d.y * d.y);
}

function circleSignedDistance(circleX, circleY, circleRadius, fromX, fromY) {
    let circle = float2(circleX, circleY);
    let from = float2(fromX, fromY);

    let distance = dist(circle.x, circle.y, from.x, from.y) - circleRadius;

    return distance;
}

export default {
    rectangleSignedDistance,
    circleSignedDistance,
}

export {rectangleSignedDistance, circleSignedDistance}