const dist = (x,y,x2,y2) => {return Math.sqrt(Math.pow(x2 - x, 2) + Math.pow(y2 - y, 2))}

const prettyMuchSamePoint = (x1, y1, x2, y2) => {
    return dist(x1, y1, x2, y2) < 0.1
}

export default dist;

export {dist, prettyMuchSamePoint}