import React from "react";

import Canvas from "../canvas/Canvas";
import CanvasProcess from "./CanvasProcess";

window.generatedComponentID = (function* () {
    let id = 0;

    while (true) {
        yield id++;
    }
})();

class CustomComponent extends React.Component {
    static Parse(inputObject) {
        const tag = inputObject.tag;
        const innerHTML = inputObject.innerHTML;
        const attributes = inputObject.keys;

        if (tag.startsWith("SUB: ")) {
            const indexOfBracket = tag.indexOf("{");
            const indexOfEndBracket = tag.indexOf("}");

            const name = tag.substring(5, indexOfBracket);
            const args = tag.substring(indexOfBracket + 1, indexOfEndBracket).split(", ");

            let argObject = {};

            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                const indexOfEqual = arg.indexOf("=");
                const key = arg.substring(0, indexOfEqual);
                const value = arg.substring(indexOfEqual + 1);

                argObject[key] = value;
            }

            switch (name) {
                case "CANVAS":
                    const cinfo = Object.assign({
                        width: 100,
                        height: 100,
                        name: "generated-custom-canvas-" + window.generatedComponentID.next().value,
                        cmds: ""
                    }, argObject);

                    let newProcess = new CanvasProcess(cinfo.cmds, cinfo.name);

                    return (<Canvas 
                        id={cinfo.name} 
                        width={cinfo.width}
                        height={cinfo.height}
                        draw={newProcess.draw.bind(newProcess)} 
                        key={cinfo.name + "-key"}
                    />);
            }
        } else {
            if (attributes["style"]) {
                if (!(attributes["style"] instanceof Object)) {
                    attributes["style"] = JSON.parse(attributes["style"]);
                }
            }

            //Create element the good old fashioned way
            const newElement = React.createElement(tag, Object.assign({
                dangerouslySetInnerHTML: {
                    __html: innerHTML
                },
                key: window.generatedComponentID.next().value + "-custom-component-default-key"
            }, attributes), null);
            
            return newElement;
        }
    }

    constructor(props) {
        super(props);

        const inputObject = props.raw;

        const numberOfComponents = inputObject.number;

        const rawComponents = inputObject.components;

        let components = [];

        for (let rawComponent of rawComponents) {
            components.push(CustomComponent.Parse(rawComponent));
        }

        if (numberOfComponents !== components.length) {
            console.warn("Number of components does not match number of components parsed. An error may have occured while building the component, on either the robot side or the client side.");
        }

        this.state = {
            components
        }
    }

    render() {
        return (
            <div>
                {this.state.components}
            </div>
        );
    }
}

export default CustomComponent;