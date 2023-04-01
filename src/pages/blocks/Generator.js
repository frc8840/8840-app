import Blockly from 'blockly';

const TillGenerator = new Blockly.Generator('Till');

//types
TillGenerator["text"] = (block) => {
    return ["\"" + block.getFieldValue("TEXT") + "\"", 0];
}

TillGenerator["math_number"] = (block) => {
    return [block.getFieldValue("NUM") + "", 0];
}


TillGenerator["logic_boolean"] = (block) => {
    return [block.getFieldValue("BOOL") + "", 0];
}

TillGenerator["game_controller"] = (block) => {
    const port = block.getFieldValue("port");
    const type = block.getFieldValue("type");

    return ["gamecontroller[" + port + ", " + type + "]", 0];
}

TillGenerator["speed_controller"] = (block) => {
    const port = block.getFieldValue("port");
    const type = block.getFieldValue("type");

    return ["speedcontroller[" + port + ", " + type + "]", 0];
}


//expressions
TillGenerator["math_arithmetic"] = (block) => {
    const operator = block.getFieldValue("OP");
    const order = (operator === "DIVIDE" || operator === "MULTIPLY") ? 5.1 : 6.2;
    const argument0 = TillGenerator.valueToCode(block, "A", order) || "0";
    const argument1 = TillGenerator.valueToCode(block, "B", order) || "0";
    let code;
    // Power in python is a bit odd, need to ensure that both arguments are
    // strings or both are numbers otherwise the first argument will be
    // cast to a string.
    if (operator === "POWER") {
        code = "mf(" + argument0 + "|pow|" + argument1 + ")";
    } else {
        code = argument0 + "|" + operator + "|" + argument1;
    }
    return ["calc(" + code + ")", order];
}

TillGenerator["logic_compare"] = (block) => {
    const operator = block.getFieldValue("OP");
    const argument0 = TillGenerator.valueToCode(block, "A", 0) || "0";
    const argument1 = TillGenerator.valueToCode(block, "B", 0) || "0";
    let code = argument0 + " " + operator + " " + argument1;
    return ["check(" + code + ")", 0];
}


TillGenerator["logic_operation"] = (block) => {
    const operator = block.getFieldValue("OP");
    const argument0 = TillGenerator.valueToCode(block, "A", 0) || "0";
    const argument1 = TillGenerator.valueToCode(block, "B", 0) || "0";
    let code = argument0 + " " + operator + " " + argument1;
    return ["twocheck(" + code + ")", 0];
}

//structures
TillGenerator["controls_if"] = (block) => {
    //Get all child code
    const statementMembers = TillGenerator.statementToCode(block, "DO0");
    const ifStatement = TillGenerator.valueToCode(block, "IF0", 0);

    return "#IF(" + ifStatement + ")\n" + statementMembers + "#ENDIF\n";
}

TillGenerator["robot_event"] = (block) => {
    //Get all child code
    const statementMembers = TillGenerator.statementToCode(block, "code");

    return "#DECLARE(" + block.getFieldValue("type").toUpperCase().replaceAll(" ", "_") + ")\n" + statementMembers + "#ENDDECLARE";
}

TillGenerator["robot_fixed_event"] = (block) => {
    const statementMembers = TillGenerator.statementToCode(block, "code");

    return "#DECLARE(" + block.getFieldValue("type").toUpperCase() + ") --FIXED\n" + statementMembers + "#ENDDECLARE";
}

TillGenerator["log"] = (block) => {
    const childCode = TillGenerator.valueToCode(block, "message", 0);

    return "LOG(" + childCode + ");\n";
}

//functions
TillGenerator["game_controller_register"] = (block) => {
    const gameControllerCode = TillGenerator.valueToCode(block, "game_controller", 0);

    return "gamecontroller_register(" + gameControllerCode + ");\n";
}

TillGenerator["get_game_controller"] = (block) => {
    const port = block.getFieldValue("port");

    return ["gamecontroller[" + port + "]", 0];
}

TillGenerator["get_game_controller_axis"] = (block) => {
    const gameControllerCode = TillGenerator.valueToCode(block, "game_controller", 0);
    const axis = block.getFieldValue("axis");

    return ["gamecontroller_get_axis(" + gameControllerCode + ", " + axis + ")", 0];
}

TillGenerator["speed_controller_register"] = (block) => {
    const speedControllerCode = TillGenerator.valueToCode(block, "speed_controller", 0);

    return "speedcontroller_register(" + speedControllerCode + ");\n";
}

TillGenerator["get_speed_controller_from_port"] = (block) => {
    const port = block.getFieldValue("port");
    
    return ["speedcontroller[" + port + "]", 0];
}

TillGenerator["speed_controller_move"] = (block) => {
    const speedControllerCode = TillGenerator.valueToCode(block, "speed_controller", 0);
    const speed = TillGenerator.valueToCode(block, "speed", 0);

    return "speedcontroller_move(" + speedControllerCode + ", " + speed + ");\n";
}

TillGenerator.scrub_ = function(block, code, thisOnly) {
    const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
    if (nextBlock) {
        if (code.endsWith("\n")) return code + TillGenerator.blockToCode(nextBlock);

        return code + '\n' + TillGenerator.blockToCode(nextBlock);
    }
    return code;
};

export default TillGenerator;