

function circleIntersectsWithTriangle(circlePos={x:0,y:0}, radius=0, trianglePos1={x:0,y:0},trianglePos2={x:0,y:0},trianglePos3={x:0,y:0}) {
    const ballRadius = radius;
    
    let triangle = [trianglePos1, trianglePos2, trianglePos3];
    let centres = triangle.map(e => {
        return {
            x: e.x - circlePos.x,
            y: e.y - circlePos.y
        }
    });

    //check if vertex is inside circle
    for (let i = 0; i < centres.length; i++) {
        let centre = centres[i];
        if (Math.sqrt(centre.x**2 + centre.y**2) <= radius) return {collision: true, between: i};
    }

    //FIX


    //check if circle is inside triangle
    let inside = true;
    let vals = [];
    for (let i = 0; i < triangle.length; i++) {
        const nextTriangle = triangle[(i + 1) % triangle.length];
        const trig = triangle[i];

        const val = ((nextTriangle.y - trig.y) * (circlePos.x - trig.x)) - ((nextTriangle.x - trig.x) * (circlePos.y - trig.y));

        if (!(val >= 0)) {
            inside = false;

            vals.push(val);
            break;
        }
    }

    if (inside) return {collision: true, between: 4};


    //check if circle intersects with any of the sides
    let c = [];
    for (let i = 0; i < 3; i++) {
        c.push({
            x: circlePos.x - triangle[i].x,
            y: circlePos.y - triangle[i].y
        })
    }

    let e = [];
    for (let i = 0; i < 3; i++) {
        e.push({
            x: triangle[(i + 1) % 3].x - triangle[i].x,
            y: triangle[(i + 1) % 3].y - triangle[i].y
        });
    }

    let k = [];
    for (let i = 0; i < 3; i++) {
        k.push(c[i].x*e[i].x + c[i].y*e[i].y);
    }

    for (let i = 0; i < 3; i++) {
        if (k[i] > 0) {
            const len = Math.sqrt(e[i].x**2 + e[i].y**2);
            k[i] = k[i] / len;

            if (k[i] < len) {
                if (Math.sqrt(c[i].x**2 + c[i].y**2 - k[i]**2) <= ballRadius) {
                    return {collision: true, between: i};
                }
            }
        }
    }

    return {collision: false, between: -1};
}


function twoCircleIntersection(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.hypot(dx, dy);

    if (d > r1 + r2) {
        return null;
    }
    if (d < Math.abs(r1 - r2)) {
        return null;
    }

    const a = (Math.pow(r1, 2) - Math.pow(r2, 2) + Math.pow(d, 2)) / (2 * d);

    const ix = x1 + (dx * a / d);
    const iy = y1 + (dy * a / d);

    const h = Math.sqrt(Math.pow(r1, 2) - Math.pow(a, 2));
    const rx = -dy * (h / d);
    const ry = dx * (h / d);

    const xi = ix + rx;
    const xi_prime = ix - rx;
    const yi = iy + ry;
    const yi_prime = iy - ry;

    return {
        p1: {
            x: xi,
            y: yi,
        },
        p2: {
            x: xi_prime,
            y: yi_prime,
        }
    }
}


export default circleIntersectsWithTriangle;

export {
    circleIntersectsWithTriangle,
    twoCircleIntersection,
}