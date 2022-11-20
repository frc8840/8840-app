import React from 'react';
import './Till.css';
import Canvas from './../../scripts/canvas/Canvas';
import TillParts from '../../scripts/till/TillPart';

class Till extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            parts: [
                new TillParts()
            ],
        }
    }
    draw(ctx) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
        
    }
    render() {
        return (
            <div>
                <div className='topbar'>
                    <p>Till</p>
                </div>
                <div className='sidebar'>
                    <Canvas width="250px" height="1000px" draw={this.draw.bind(this)}></Canvas>
                </div>
            </div>
        );
    }
}

export default Till;