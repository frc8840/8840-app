import { TillAppearance } from "./TillPart"

const printBlock = {
    text: "Print %%s/string%%",
    style: new TillAppearance({
        background: "white",
        textColor: "black", 
        outlineColor: "black",
        type: TillAppearance.Type.BLOCK, 
        width: 95, height: 40
    })
}

const addInput = {
    text: "%%n/number%% + %%n/number2%%",
    style: new TillAppearance({
        background: "rgb(81, 132, 70)",
        textColor: "white", 
        outlineColor: "black",
        type: TillAppearance.Type.INPUT,
        width: 97, height: 20
    })
}


const list = {
    print: printBlock,
    add: addInput,
}

export default list;