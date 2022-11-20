

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


export default circleIntersectsWithTriangle;