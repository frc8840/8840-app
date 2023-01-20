import React from 'react';
import './Till.css';
import TillParts, { TillAppearance } from '../../scripts/till/TillPart';
import list from '../../scripts/till/Parts';

window.generateTillKey = (function*() {
    let id = 0;
    while (true) {
        yield id++;
    }
})();

class Till extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            currentParts: [],
        }
    }

    createFromPart(partStruct={text: "", style: new TillAppearance()}) {
        const key = "tillpart" + window.generateTillKey.next().value;
        return (<TillParts key={key} _key={key} tillName={partStruct.text} tillStyle={partStruct.style}/>)
    }

    onClick() {

    }

    componentDidMount() {
        setTimeout(() => {
            let pos = {x: 30, y: 30};

            //Loop through all of the parts and move them down 50px
            for (let i = 0; i < this.state.currentParts.length; i++) {
                const part = this.state.currentParts[i];
                const ele = part.ele;
                const ref = part.ref;

                try {
                    document.getElementById(ele.props._key).style.left = pos.x + "px";
                    document.getElementById(ele.props._key).style.top = pos.y + "px";
                } catch (e) {
                    continue;
                }

                pos.y += ref.style.height + 30;
            }
        }, 50);
    }

    render() {
        const instantiableParts = Object.keys(list).map((key) => {
            const newPart = this.createFromPart(list[key]);

            this.state.currentParts.push({
                ele: newPart,
                ref: list[key]
            });

            return newPart;
        });

        return (
            <div>
                <div className='topbar'>
                    <p>Till</p>
                </div>
                <div className='sidebar'>
                    {instantiableParts}
                </div>
            </div>
        );
    }
}

export default Till;