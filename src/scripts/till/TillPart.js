import React from "react";

import "./TillPart.css"

class TillAppearance {
    static Type = {
        INPUT: 0,
        BLOCK: 1,
        RUN_BLOCK: 2,
    }
    static DefaultSettings = {
        background: "white", 
        textColor: "black", 
        outlineColor: "black",
        type: TillAppearance.Type.BLOCK, 
        width: 100, height:20,
        fontSize: 16,
    }
    constructor(options = TillAppearance.DefaultSettings) {
        const { background, textColor, type, width, height, outlineColor, fontSize } = Object.assign(TillAppearance.DefaultSettings, options);
        
        this.background = background;
        this.textColor = textColor;
        this.outlineColor = outlineColor;
        this.type = type;
        this.width = width;
        this.height = height;
        this.fontSize = fontSize;
    }
}

class TillParts extends React.Component {
    static InputType = {
        STRING: 0,
        NUMBER: 1,
        BOOLEAN: 2,
    }
    static parseTypeFromChar(char) {
        switch (char) {
            case "s":
                return TillParts.InputType.STRING
            case "n":
                return TillParts.InputType.NUMBER
            case "b":
                return TillParts.InputType.BOOLEAN
            default:
                return TillParts.InputType.STRING
        }
    }
    constructor(props) {
        super(props);

        this.state = {
            tillStyle: props.tillStyle,
            name: props.tillName,
            inputValues: {},
        }

        this.ref = React.createRef();

        this.init.bind(this)();
    }
    init() {
        const hasInput = this.state.name.includes("%%");

        const getNames = (str) => {
            const names = str.split("%%");
            let nameList = [];
            for (let i = 0; i < names.length; i++) {
                if (i % 2 === 1) {
                    nameList.push(names[i]);
                }
            }
            return nameList;
        }

        if (hasInput) {
            const names = getNames(this.state.name);

            let registeredInputs = 0;

            for (let name of names) {
                if (name.split("/").length < 2) {
                    throw new Error("Invalid input name: " + name);
                }

                const splitUpName = name.split("/");

                if (splitUpName[0].length !== 1) {
                    throw new Error("Invalid input name: " + name);
                }

                registeredInputs++;

                this.state.inputValues[name] = {
                    type: TillParts.parseTypeFromChar(splitUpName[0]),
                    value: name.substring(2),
                    registeredTo: registeredInputs + 1 - 1,
                }

                this.state.name = this.state.name.replace("%%" + name + "%%", "%" + registeredInputs + "%");
            }
        }
    }

    onUpdateInput() {

    }

    render() {
        let classList = ["till-part"];

        switch (this.state.tillStyle.type) {
            case TillAppearance.Type.BLOCK:
                classList.push("till-part-block");
                break;
            case TillAppearance.Type.INPUT:
                classList.push("till-part-input");
                break;
            case TillAppearance.Type.RUN_BLOCK:
                classList.push("till-part-run-block");
                break;
        }

        return (
            <div className={classList.join(" ")} id={this.props._key} style={
                {
                    height: this.state.tillStyle.height + "px",
                    width: this.state.tillStyle.width + "px",
                    backgroundColor: this.state.tillStyle.background,
                    color: this.state.tillStyle.textColor,
                    borderColor: this.state.tillStyle.outlineColor,
                    fontSize: this.state.tillStyle.fontSize + "px",
                    left: this.state.x + "px",
                    top: this.state.y + "px",
                }
            } ref={this.ref}>
                <p>{this.state.name}</p>
            </div>
        )
    }
}

export default TillParts;

export {TillAppearance, TillParts};