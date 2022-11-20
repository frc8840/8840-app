import React, { useRef, useEffect } from "react";

if (!Object.keys(global).includes("lastPoses")) {
    global.lastPoses = {};
}

function Canvas(props={}) {
    let canvasRef = useRef(null)
    if (!Object.keys(global).includes("lastPoses")) global.lastPoses = {};

    if (!Object.keys(global.lastPoses).includes(props.id || "default")) {
        global.lastPoses[props.id || "default"] = {x:0,y:0};
    }

    setTimeout(() => {
        canvasRef = canvasRef.current;
    }, 150)

    const draw = props.draw || ((ctx, frameCount) => {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        ctx.fillStyle = '#000000'
        ctx.beginPath()
        ctx.arc(50, 100, 20*Math.sin(frameCount*0.05)**2, 0, 2*Math.PI)
        ctx.fill()
    }).bind(this);

    useEffect(() => {
        const canvas = canvasRef.current;

        let mouseData = {
            x: global.lastPoses[props.id] ? global.lastPoses[props.id].x : 0,
            y: global.lastPoses[props.id] ? global.lastPoses[props.id].y : 0,
            down: false,
            inCanvas: false,
        }

        const mouseDown = (e) => {
            mouseData.down = true;
            mouseData.x = e.clientX - e.target.getBoundingClientRect().left;
            mouseData.y = e.clientY - e.target.getBoundingClientRect().top;
            global.lastPoses[props.id] = mouseData;
        };

        const mouseUp = (e) => {
            mouseData.down = false;
        }

        const mouseMove = (e) => {
            mouseData.x = e.clientX - e.target.getBoundingClientRect().left;
            mouseData.y = e.clientY - e.target.getBoundingClientRect().top;
            if (!mouseData.inCanvas) mouseData.inCanvas = true;
        }
        
        const mouseLeave = (e) => {
            mouseData.inCanvas = false;
        }

        canvas.addEventListener('mousedown', mouseDown);
        canvas.addEventListener('mouseup', mouseUp);
        canvas.addEventListener('mousemove', mouseMove);
        canvas.addEventListener('mouseleave', mouseLeave);

        const context = canvas.getContext('2d')
        let frameCount = 0, animationFrameId;

        let size = {
            width: canvas.width,
            height: canvas.height
        }

        const rect = canvas.getBoundingClientRect()

        const render = (e) => {
            frameCount++;
            
            global.lastPoses[Object.keys(props).includes("id") ? props.id : "randomid"] = {
                x: mouseData.x,
                y: mouseData.y
            }

            draw(context, frameCount, {
                width: size.width / 500,
                w: size.width / 500,
                height: size.height / 500,
                h: size.height / 500
            }, canvas, {
                x: mouseData.x,
                y: mouseData.y,
                down: mouseData.down,
                inCanvas: mouseData.inCanvas,
                cancelMouseDown: () => {
                    mouseData.down = false;
                }
            });
            animationFrameId = requestAnimationFrame(render);
        }

        render({
            clientX: 0,
            clientY: 0
        });

        return () => {
            window.cancelAnimationFrame(animationFrameId);
            canvas.removeEventListener('mousedown', mouseDown);
            canvas.removeEventListener('mouseup', mouseUp);
            canvas.removeEventListener('mousemove', mouseMove);
        }
    }, [draw]);

    return <canvas ref={canvasRef} {...{width: props.width || "100px", height: props.height || "100px"}}/>
}

export default Canvas;