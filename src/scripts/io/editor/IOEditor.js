import React from "react";
import Mover from "../../mover/Mover";
import { addTabListener, putValue } from "../../pynetworktables2js/wrapper";

import "./IOEditor.css"

const noneText = "None"

class IOEditor extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            currentlyEditing: null,
            cache: {},
            permissionsCache: {},
        }

        addTabListener("IO", (key, value, isNew) => {
            //EX: [IO]/name/0/method_name/value = value
            //EX: [IO]/name/0/.info/real = true or false
            //EX: [IO]/name/.info/p = true or false

            const splitKey = key.split("/");
            const gsk = (i) => {
                if (splitKey.length <= i) return "";
                return splitKey[i];
            }

            const objectName = gsk(0);
            const index = gsk(1);
            const valueName = gsk(2);
            const ioObjectKey = gsk(3);

            const isRealInfo = gsk(2) == ".info" && gsk(3) == "real";
            const getPermissions = gsk(1) == ".info" && gsk(2) == "p";

            if (getPermissions) {
                this.state.permissionsCache[objectName] = value;
            } else {
                if (!this.state.cache[objectName]) {
                    this.state.cache[objectName] = {};
                }

                if (!this.state.cache[objectName][index]) {
                    this.state.cache[objectName][index] = {};
                }

                if (isRealInfo) {
                    this.state.cache[objectName][index] = {
                        ...this.state.cache[objectName][index],
                        real: (value == "true" || value == true),
                    }
                } else {
                    this.state.cache[objectName][index][valueName] = {
                        ...this.state.cache[objectName][index][valueName],
                        [ioObjectKey]: value,
                    }
                }
            }

            this.updateEditingList();
        })

        setInterval(() => {
            const editing = this.state.currentlyEditing;

            if (editing == null) {
                return;
            }

            let index = 0;
            let name = editing + "";

            //get the second last character of the name
            const secondLastChar = name.charAt(name.length - 2);
            const lastChar = name.charAt(name.length - 1);

            if (secondLastChar == "/" && parseInt(lastChar) >= 0) {
                index = parseInt(lastChar);

                //remove the last two characters
                name = name.substring(0, name.length - 2);
            }

            const key = name + "/" + index;

            const object = this.state.cache[name][index];

            const methodNames = Object.keys(object);

            for (let method of methodNames) {
                if (method == "real") continue;

                if (Object.keys(object[method]).includes("v")) {
                    const id = "io-editor-value-" + btoa(key + "-" + method);

                    const ele = document.getElementById(id);

                    if (ele) {
                        const value = object[method].v;

                        if (ele.value != value) {
                            ele.textContent = value;
                        }
                    }
                }
            }
        }, 1000 / 60);

        this.writeValue.bind(this);
        this.updateEditingList.bind(this);
        this.updateInformation.bind(this);
    }

    updateEditingList() {
        const list = [];

        for (let name of Object.keys(this.state.cache)) {
            for (let index of Object.keys(this.state.cache[name])) {
                list.push(`${name}/${index}`);
            }
        }

        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            //get the last character
            const lastChar = item[item.length - 1] + "";

            if (lastChar != "0") continue;

            //replace last character with a space
            const newStr = item.substring(0, item.length - 1) + "1";

            if (!list.includes(newStr)) {
                list[i] = item.substring(0, item.length - 2);
            }
        }

        //sort the list
        list.sort();

        //insert the none text at the beginning
        list.unshift(noneText);

        const select = document.getElementById("io-editing-list");
        
        let differentItems = false;

        for (let i = 0; i < list.length; i++) {
            if (select.options.length != list.length) {
                differentItems = true;
                break;
            }

            if (select.options[i].value != list[i]) {
                differentItems = true;
                break;
            }
        }

        if (differentItems) {

            select.innerHTML = "";

            for (let item of list) {
                const option = document.createElement("option");
                option.value = item;
                option.innerHTML = item;

                select.appendChild(option);
            }

            select.value = this.state.currentlyEditing || noneText;

            select.onchange = () => {
                if (select.value === noneText) {
                    this.state.currentlyEditing = null;
                } else {
                    this.state.currentlyEditing = select.value;
                }

                this.updateInformation();
            }
        }
    }

    updateInformation() {
        const editing = this.state.currentlyEditing;

        if (editing == null) {
            return;
        }

        let index = 0;
        let name = editing + "";

        //get the second last character of the name
        const secondLastChar = name.charAt(name.length - 2);
        const lastChar = name.charAt(name.length - 1);

        if (secondLastChar == "/" && parseInt(lastChar) >= 0) {
            index = parseInt(lastChar);

            //remove the last two characters
            name = name.substring(0, name.length - 2);
        }

        const key = name + "/" + index;

        const object = this.state.cache[name][index];

        const methodNames = Object.keys(object);

        const parent = document.getElementById("io-editor-info");
        parent.innerHTML = "";

        const isRealEle = document.createElement("p");
        isRealEle.innerHTML = "Real: ";

        const isRealValueEle = document.createElement("span");
        isRealValueEle.textContent = object.real;

        isRealEle.appendChild(isRealValueEle);

        parent.appendChild(isRealEle);

        for (let method of methodNames) {
            if (method == "real") continue;

            const methodParent = document.createElement("div");
            methodParent.className = "io-editor-method";

            const nameEle = document.createElement("p");
            nameEle.innerHTML = ":: ";

            const nameValueEle = document.createElement("span");
            nameValueEle.textContent = method;

            nameEle.appendChild(nameValueEle);

            methodParent.appendChild(nameEle);
            
            const typeEle = document.createElement("p");
            typeEle.innerHTML = "Type: ";

            const typeValueEle = document.createElement("span");
            typeValueEle.textContent = object[method].t;

            typeEle.appendChild(typeValueEle);

            methodParent.appendChild(typeEle);

            if (Object.keys(object[method]).includes("v")) {
                const valueEle = document.createElement("p");
                valueEle.innerHTML = "Value: ";
                
                const valueInput = document.createElement("span");
                valueInput.textContent = object[method].v;
                valueInput.id = "io-editor-value-" + btoa(key + "-" + method);

                valueEle.appendChild(valueInput);

                methodParent.appendChild(valueEle);
            } else {
                const writeEle = document.createElement("p");
                writeEle.innerHTML = "Write: ";

                const writeInput = document.createElement("input");
                writeInput.type = "text";
                writeInput.classList.add("io-editor-write-input");

                writeEle.appendChild(writeInput);

                methodParent.appendChild(writeEle);

                const writeButton = document.createElement("button");

                writeButton.onclick = () => {
                    this.writeMethod(key, method, writeInput.value);
                }

                writeButton.classList.add("io-editor-write-button")

                writeButton.innerHTML = "Write";

                methodParent.appendChild(writeButton);
            }

            parent.appendChild(methodParent);
        }
    }

    doTypeCheck(value="", typeofObject="") {
        //do checks based on type, to check whether the value is valid

        const validTypes = [
            "DOUBLE",
            "INT",
            "STRING",
            "BOOLEAN",
            "BYTE_ARRAY",
            "DOUBLE_ARRAY",
            "LONG_ARRAY",
            "STRING_ARRAY",
            "BOOLEAN_ARRAY",
            "NONE"
        ]

        if (!validTypes.includes(typeofObject)) {
            alert("Invalid type!");
            return null;
        }

        if (typeofObject === "DOUBLE") {
            value = parseFloat(value);

            if (isNaN(value)) {
                alert("Value is not a number!");
                return null;
            }
        } else if (typeofObject === "INT") {
            value = parseInt(value);

            if (isNaN(value)) {
                alert("Value is not a number!");
                return null;
            }
        } else if (typeofObject === "STRING") {
            value = value.toString();
        } else if (typeofObject === "BOOLEAN") {
            if (value === "true") {
                value = true;
            } else if (value === "false") {
                value = false;
            } else {
                alert("Value is not a boolean!");
                return null;
            }
        } else if (typeofObject === "BYTE_ARRAY") {
            //byte arrays are just strings, so we don't need to do anything
        } else if (typeofObject === "DOUBLE_ARRAY") {
            //check if the value is a valid array
            if (!value.startsWith("[") || !value.endsWith("]")) {
                alert("Value is not a valid array!");
                return;
            }

            //remove the brackets
            value = value.substring(1, value.length - 1);

            //split the array
            value = value.split(",");

            //parse the array
            value = value.map((v) => {
                return parseFloat(v);
            });

            //check if the array is valid
            if (value.includes(NaN)) {
                alert("Value is not a valid array!");
                return null;
            }
        } else if (typeofObject === "LONG_ARRAY") {
            //check if the value is a valid array
            if (!value.startsWith("[") || !value.endsWith("]")) {
                alert("Value is not a valid array!");
                return null;
            }
            
            //remove the brackets
            value = value.substring(1, value.length - 1);

            //split the array
            value = value.split(",");

            //parse the array
            value = value.map((v) => {
                return parseInt(v);
            });

            //check if the array is valid
            if (value.includes(NaN)) {
                alert("Value is not a valid array!");
                return null;
            }

        } else if (typeofObject === "STRING_ARRAY") {
            //check if the value is a valid array
            if (!value.startsWith("[") || !value.endsWith("]")) {
                alert("Value is not a valid array!");
                return null;
            }
            
            //remove the brackets
            value = value.substring(1, value.length - 1);

            //split the array
            value = value.split(",");

            //parse the array
            value = value.map((v) => {
                return v.toString();
            });

        } else if (typeofObject === "BOOLEAN_ARRAY") {
            //check if the value is a valid array
            if (!value.startsWith("[") || !value.endsWith("]")) {
                alert("Value is not a valid array!");
                return null;
            }

            //remove the brackets
            value = value.substring(1, value.length - 1);

            //split the array
            value = value.split(",");

            //parse the array
            value = value.map((v) => {
                if (v === "true") {
                    return true;
                } else if (v === "false") {
                    return false;
                } else {
                    return null;
                }
            });

            //check if the array is valid
            if (value.includes(NaN)) {
                alert("Value is not a valid array!");
                return null;
            }
        } else {
            alert("Value is not a valid type!");
            return null;
        }

        return value;
    }

    writeMethod(key, method, value) {
        this.writeValue.bind(this)(method, value);
    }

    writeValue(method, value) {
        let currentlyEditing = this.state.currentlyEditing;

        if (currentlyEditing === null) {
            return;
        }

        let name = currentlyEditing;
        let index = 0;

        //get the second last character of the name
        const secondLastChar = name.charAt(name.length - 2);
        const lastChar = name.charAt(name.length - 1);

        if (secondLastChar == "/" && parseInt(lastChar) >= 0) {
            index = parseInt(lastChar);

            //remove the last two characters
            name = name.substring(0, name.length - 2);
        }

        const key = name + "/" + index;

        let typeofMethod = this.state.cache[name][index][method].t;

        let parsedValue = this.doTypeCheck(value, typeofMethod);

        if (parsedValue != null) {
            putValue("IO", `${key}/${method}/w`, parsedValue);
        }
     }

    render() {
        return (
            <div id="io-editor-parent">
                <Mover target="io-editor-parent"></Mover>
                <div id="io-editor-content">
                    <h1>IO Editor</h1>
                    <p>Currently Editing Value: </p>
                    <select name="editing" id="io-editing-list">
                        <option value={noneText}>{noneText}</option>
                    </select>
                    <div id="io-editor-info">
                        <p>Not editing anything at the moment!</p>
                        {/* <p>Is Real? <span id="io-object-real">false</span></p>
                        <p>Type: <span id="io-object-type">UNKNOWN</span></p>
                        <p>Value: <span id="io-object-value">?</span></p>
                        <p>Permissions: <span id="io-object-permissions">NONE</span></p>
                        <div id="io-editor-info-write" style={{display: "none"}}>
                            <p>Write Value:</p>
                            <input type="text" id="io-editor-write-value"></input>
                            <br/>
                            <button id="io-editor-write-button" onClick={this.writeValue.bind(this)}>Write</button>
                        </div> */}
                    </div>
                </div>
            </div>
        )
    }
}

export default IOEditor;