import React from "react"

import "./Mover.css"

if (!Object.keys(global).includes("mover_ids")) {
    global.mover_ids = [];
}

if (!Object.keys(window).includes("mover_hierarchy")) {
    window.hierachy = {};
}

const chars = "qwertyuiopasdfghjklzxcvbnm1234567890".split("");
function createMoverID(target) {
    if (global.mover_ids_pstr) {
        if (global.mover_ids_pstr[target]) {
            return global.mover_ids_pstr[target];
        }
    }
    // let str = "";
    // do {
    //     str = "";
    //     for (let i = 0; i < 6; i++) {
    //         str += chars[Math.floor(Math.random() * chars.length)];
    //     }
    // } while (global.mover_ids.includes(str));
    // global.mover_ids.push(str);
    return target + "_mover";
}

function catchAndInsertID(target, id) {
    if (!global.mover_ids_pstr) {
        global.mover_ids_pstr = {};
    }
    global.mover_ids_pstr[target] = id;
}

class Mover extends React.Component {
    constructor(props) {
        super(props)

        let lastPos = {x:0,y:0};
        if (!Object.keys(this.props).includes("target")) throw "Need target in order to use mover."

        this.state = {
            id: createMoverID(this.props.target),
            mouseDown: false,
            mouseOver: false,
            lastPos,
        }

        const sortedHierarchy = Object.keys(window.hierachy).sort((a, b) => {
            return window.hierachy[b].index - window.hierachy[a].index;
        });

        window.hierachy[this.props.target] = {
            index: sortedHierarchy[0] + 1,
            refer: this.state.id
        }
    }
    savePosition() {
        const target = document.getElementById(this.props.target);
        window.localStorage.setItem(this.props.target + "_mover", JSON.stringify({
            x: target.style.left || null,
            y: target.style.top || null,
        }));
    }
    loadPosition() {
        if (window.localStorage.getItem(this.props.target + "_mover") != null) {
            const target = document.getElementById(this.props.target);
            const pos = JSON.parse(window.localStorage.getItem(this.props.target + "_mover"));

            if (Object.keys(pos).includes("x") && Object.keys(pos).includes("y")) {
                const xPos = pos.x;
                const yPos = pos.y;

                target.style.left = xPos == null ? "20px" : (xPos.includes("-") ? "20px" : pos.x);
                target.style.top = yPos == null ? "20px" : (pos.y.includes("-") ? "20px" : pos.y);
            }

            (this.setLastBoundingBox.bind(this))();
        }
    }
    mouseDown(e) {
        this.setState({
            mouseDown: true
        })
        this.state.mouseDown = true;
    }
    mouseUp(e) {
        //console.log("mouse up")
        this.setState({
            mouseDown: false
        })
        this.state.mouseDown = false;

        //console.log('OAIDSNGKJASDNG')

        this.savePosition();
    }
    mouseOver(e) {
        this.setState({
            mouseOver: true
        })
        this.state.mouseOver = true;
    }
    mouseLeave(e) {
        if (!this.mouseDown) {
            this.setState({
                mouseOver: false
            })
            this.state.mouseOver = false;
        }
    }
    mouseMove(e) {
        //get mouse position
        let x = e.clientX < 5 ? 5 : e.clientX;
        let y = e.clientY < 5 ? 5 : e.clientY;
        
        if (Object.keys((this.props || {})).includes("target")) {
            const target = document.getElementById(this.props.target);
            if (target == null) return;

            const targetRect = document.getElementById(this.state.id).getBoundingClientRect();
            const differenceFromLastPos = {
                x: x - this.state.lastPos.x,
                y: y - this.state.lastPos.y
            }
            //console.log(targetRect)
            if (this.state.mouseDown) {
                const boundingBox = document.getElementById(this.state.id).getBoundingClientRect();
                const parentBoundingBox = document.getElementById(this.state.id).parentElement.getBoundingClientRect();
                let differenceFromParent = {
                    x: boundingBox.x - parentBoundingBox.x,
                    y: boundingBox.y - parentBoundingBox.y
                }

                target.style.left = (targetRect.x + differenceFromLastPos.x - differenceFromParent.x - 4) + "px";
                target.style.top = (targetRect.y + differenceFromLastPos.y - differenceFromParent.y - 4) + "px";
                (this.setLastBoundingBox.bind(this))();
            }    
        }
    }
    setLastBoundingBox() {
        const boundingBox = document.getElementById(this.state.id).getBoundingClientRect();
        this.setState({
            lastPos: {
                x: boundingBox.x,
                y: boundingBox.y
            }
        })
        this.state.lastPos = {
            x: boundingBox.x,
            y: boundingBox.y
        }
    }

    componentDidMount() {
        setTimeout(() => {
            this.loadPosition();

            if (window.localStorage.getItem(this.props.target + "_mover") != null) {
                const target = document.getElementById(this.props.target);
                const pos = JSON.parse(window.localStorage.getItem(this.props.target + "_mover"));
                target.style.left = pos.x;
                target.style.top = pos.y;
            }

            const ele = document.getElementById(this.state.id);
            (this.setLastBoundingBox.bind(this))();
            ele.addEventListener("mousedown", this.mouseDown.bind(this));
            window.addEventListener("mouseup", this.mouseUp.bind(this));
            ele.addEventListener("mouseover", this.mouseOver.bind(this));
            ele.addEventListener("mouseleave", this.mouseLeave.bind(this));
            document.addEventListener("mousemove", this.mouseMove.bind(this));
        }, 50)
    }

    componentWillUnmount() {
        catchAndInsertID(this.props.target, this.state.id);

        const ele = document.getElementById(this.state.id);
        ele.removeEventListener("mousedown", this.mouseDown.bind(this));
        window.removeEventListener("mouseup", this.mouseUp.bind(this));
        ele.removeEventListener("mouseover", this.mouseOver.bind(this));
        ele.removeEventListener("mouseleave", this.mouseLeave.bind(this));
        document.removeEventListener("mousemove", this.mouseMove.bind(this))
    }

    render() {
        return (
            <div className="mover" id={this.state.id}></div>
        )
    }
}

export default Mover;