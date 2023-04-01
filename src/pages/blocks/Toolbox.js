import Blockly from 'blockly';

/**
 * Event Blocks
 */

const events = [
    ["Robot Init", "robotInit"],
    ["Robot Periodic", "robotPeriodic"],
    ["Autonomous Init", "autonomousInit"],
    ["Autonomous Periodic", "autonomousPeriodic"],
    ["Teleop Init", "teleopInit"],
    ["Teleop Periodic", "teleopPeriodic"],
    ["Disabled Init", "disabledInit"],
    ["Disabled Periodic", "disabledPeriodic"],
    ["Test Init", "testInit"],
    ["Test Periodic", "testPeriodic"],
]

Blockly.Blocks['robot_event'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Event")
            .appendField(new Blockly.FieldDropdown(events), "type");
        this.appendStatementInput("code")
            .setCheck(null);
        this.setColour(10);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

const fixedEvents = [
    ["Autonomous", "autonomousFixed"],
    ["Teleop", "teleopFixed"],
    ["Disabled", "disabledFixed"],
    ["Test", "testFixed"],
];

Blockly.Blocks['robot_fixed_event'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Fixed")
            .appendField(new Blockly.FieldDropdown(fixedEvents), "type")
            .appendField("Periodic");
        this.appendStatementInput("code")
            .setCheck(null);
        this.setColour(10);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

/**
 * Logging
 */

Blockly.Blocks['log'] = {
    init: function() {
        this.appendValueInput("message")
            .setCheck(["String", "Number", "Boolean"])
            .appendField("Log");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(100);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

/**
 * Game Controller Blocks
 */

const gameControllerTypes = [
    ["Xbox", "Xbox"],
    ["Logitech", "Logitech"],
    ["Playstation", "Playstation"],
    ["Simulated", "Simulated"],
    ["Generic", "Generic"]
]

Blockly.Blocks['game_controller'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Game Controller, Port: ")
            .appendField(new Blockly.FieldNumber(0, 0, 6, 1), "port")
            .appendField(", Type: ")
            .appendField(new Blockly.FieldDropdown(gameControllerTypes), "type");
        this.setOutput(true, "game_controller_register_callback");
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}

Blockly.Blocks["game_controller_register"] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Register Game Controller");
        this.appendValueInput("game_controller")
            .setCheck("game_controller_register_callback");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}

Blockly.Blocks["get_game_controller"] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Get Game Controller, Port: ")
            .appendField(new Blockly.FieldNumber(0, 0, 6, 1), "port");
        this.setOutput(true, "game_controller");
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}

const gameControllerAxis = [
    ["Vertical", "Vertical"],
    ["Horizontal", "Horizontal"],
    ["Twist", "Twist"],
]

Blockly.Blocks["get_game_controller_axis"] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Get Axis, Controller:");
        this.appendValueInput("game_controller")
            .setCheck("game_controller");
        this.appendDummyInput()
            .appendField("Axis: ")
            .appendField(new Blockly.FieldDropdown(gameControllerAxis), "axis");
        
        this.setInputsInline(true);
        this.setOutput(true, "Number");
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}

/**
 * Swerve Drive Blocks
 */

Blockly.Blocks['swerve_drive_angle_offsets'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Angle Offsets TL:")
            .appendField(new Blockly.FieldNumber(0, -360, 360, 1), "TL")
            .appendField("TR:")
            .appendField(new Blockly.FieldNumber(0, -360, 360, 1), "TR")
            .appendField("BL:")
            .appendField(new Blockly.FieldNumber(0, -360, 360, 1), "BL")
            .appendField("BR:")
            .appendField(new Blockly.FieldNumber(0, -360, 360, 1), "BR");
        this.setOutput(true, "Array");
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}

Blockly.Blocks['four_port_list'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Ports TL:")
            .appendField(new Blockly.FieldNumber(0, 0, 10000, 1), "port_1")
            .appendField("TR:")
            .appendField(new Blockly.FieldNumber(0, 0, 10000, 1), "port_2")
            .appendField("BL:")
            .appendField(new Blockly.FieldNumber(0, 0, 10000, 1), "port_3")
            .appendField("BR:")
            .appendField(new Blockly.FieldNumber(0, 0, 10000, 1), "port_4");
        this.setOutput(true, "four_port_list");
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}

Blockly.Blocks['swerve_drive_settings'] = {
    //Swerve Drive Settings needs to be a block that can be dragged into the workspace
    //In 8840-lib, it has inputs:
    /**
     * @param {double} wheelBase
     * @param {double} trackWidth
     * @param {double} wheelDiameter
     * @param {int[]} angleOffsets
     * @param {boolean} invertGyro
     */

    init: function() {
        this.appendDummyInput()
            .appendField("Swerve Drive Settings");
        this.appendValueInput("wheelBase")
            .setCheck("Number")
            .appendField("Wheel Base");
        this.appendValueInput("trackWidth")
            .setCheck("Number")
            .appendField("Track Width");
        this.appendValueInput("wheelDiameter")
            .setCheck("Number")
            .appendField("Wheel Diameter");
        this.appendValueInput("angleOffsets")
            .setCheck("Array")
            .appendField("Angle Offsets");
        this.appendValueInput("invertGyro")
            .setCheck("Boolean")
            .appendField("Invert Gyro");
        this.setOutput(true, "swerve_drive_settings");
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['swerve_drive'] = {
    //Swerve Drive needs to be a block that can be dragged into the workspace
    //In 8840-lib, it has inputs:
    /**
     * @param {String} name
     * @param {SwerveDriveSettings} settings
     * @param {int[]} port
     * @param {int[]} anglePort
     * @param {int[]} encoderPort
     * @param {Pigeon} pigeon
     */

    init: function() {
        this.appendDummyInput()
            .appendField("Create Swerve Drive");
        this.appendValueInput("name")
            .setCheck("String")
            .appendField("Name");
        this.appendValueInput("settings")
            .setCheck("swerve_drive_settings")
            .appendField("Settings");
        this.appendValueInput("port")
            .setCheck("four_port_list")
            .appendField("Port");
        this.appendValueInput("anglePort")
            .setCheck("four_port_list")
            .appendField("Angle Port");
        this.appendValueInput("encoderPort")
            .setCheck("four_port_list")
            .appendField("Encoder Port");
        // this.appendValueInput("pigeon")
        //     .setCheck("Pigeon")
        //     .appendField("Pigeon");
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['swerve_drive_movement'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Swerve Drive Movement");
        this.appendValueInput("forward")
            .setCheck("Number")
            .appendField("Forward:");
        this.appendValueInput("strafe")
            .setCheck("Number")
            .appendField("Strafe:")
        this.appendValueInput("rotation")
            .setCheck("Number")
            .appendField("Rotation:");
        this.appendValueInput("fieldOriented")  
            .setCheck("Boolean")
            .appendField("Field Oriented:");
            
        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("");
    }
}

/**
 * Speed Controller Blocks
 */

const speedControllerTypes = [
    ["Talon SRX", "TalonSRX"],
    ["Victor SPX", "VictorSPX"],
    ["Spark Max", "SparkMax"],
    ["Spark", "Spark"]
];

Blockly.Blocks['speed_controller'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Speed Controller ")
            .appendField(new Blockly.FieldDropdown(speedControllerTypes), "type")
            .appendField(", Port: ")
            .appendField(new Blockly.FieldNumber(0, 0, 10000, 1), "port");
        this.setOutput(true, 'speed_controller_register_callback');
        this.setColour(130);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}

/**
 * Speed Controller Variables
 */

// Block for variable getter.
Blockly.Blocks['speed_controller_get'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Speed Controller ")
            .appendField(new Blockly.FieldVariable("VAR_NAME", null, ['speed_controller'], 'speed_controller'), "FIELD_NAME");
        this.setOutput(true, 'speed_controller');
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['get_speed_controller_from_port'] ={
    init: function() {
        this.appendDummyInput()
            .appendField("Speed Controller, Port: ")
            .appendField(new Blockly.FieldNumber(0, 0, 10000, 1), "port");
        this.setOutput(true, 'speed_controller');
        this.setColour(130);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}
  
  // Block for variable setter.
Blockly.Blocks['speed_controller_set'] = {
    init: function() {
        this.appendValueInput("NAME")
            .setCheck("speed_controller")
            .appendField("set")
            .appendField(new Blockly.FieldVariable(
                "VAR_NAME", null, ['speed_controller'], 'speed_controller'), "FIELD_NAME")
            .appendField("to");
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

Blockly.Blocks['speed_controller_register'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Create Speed Controller");
        this.appendValueInput("speed_controller")
            .setCheck("speed_controller_register_callback");
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(150);
        this.setTooltip("");
        this.setHelpUrl("");
    }
}

/**
 * Moving Speed Controllers
 */

Blockly.Blocks['speed_controller_move'] = {
    init: function() {
        this.appendDummyInput()
            .appendField("Run Speed Controller")
        this.appendValueInput("speed_controller")
            .setCheck("speed_controller");
        this.appendDummyInput()
            .appendField("at speed ")
        this.appendValueInput("speed")
            .setCheck("Number");
        
        this.setInputsInline(true);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(230);
        this.setTooltip("");
        this.setHelpUrl("");
    }
};

const Toolbox = {
    "kind": "categoryToolbox",
    "contents": [
        {
            "kind": "category",
            "name": "Control",
            "contents": [
                {
                    "kind": "block",
                    "type": "controls_if"
                },
            ]
        },
        {
            "kind": "category",
            "name": "Math",
            "contents": [
                {
                    "kind": "block",
                    "type": "math_number"
                },
                {
                    "kind": "block",
                    "type": "math_arithmetic"
                },
            ]
        },
        {
            "kind": "category",
            "name": "Logic",
            "contents": [
                {
                    "kind": "block",
                    "type": "logic_compare"
                },
                {
                    "kind": "block",
                    "type": "logic_operation"
                },
                {
                    "kind": "block",
                    "type": "logic_boolean"
                },
            ]
        },
        {
            "kind": "category",
            "name": "Game Controller",
            "contents": [
                {
                    "kind": "block",
                    "type": "game_controller"
                },
                {
                    "kind": "block",
                    "type": "game_controller_register"
                },
                {
                    "kind": "block",
                    "type": "get_game_controller"
                },
                {
                    "kind": "block",
                    "type": "get_game_controller_axis"
                },
            ]
        },
        {
            "kind": "category",
            "name": "Events",
            "contents": [
                {
                    "kind": "block",
                    "type": "robot_event",
                },
                {
                    "kind": "block",
                    "type": "robot_fixed_event",
                },
            ]
        },
        {
            "kind": "category",
            "name": "Logging",
            "contents": [
                {
                    "kind": "block",
                    "type": "log"
                },
                {
                    "kind": "block",
                    "type": "text"
                }
            ]
        },
        {
            "kind": "category",
            "name": "Speed Controller",
            "contents": [
                //Add speed controller variable button
                {
                    "kind": "block",
                    "type": "speed_controller"
                },
                {
                    "kind": "block",
                    "type": "speed_controller_register"
                },
                {
                    "kind": "block",
                    "type": "get_speed_controller_from_port"
                },
                // {
                //     "kind": "block",
                //     "type": "variables_get_speed_controller"
                // },
                // {
                //     "kind": "block",
                //     "type": "variables_set_speed_controller"
                // },
                {
                    "kind": "block",
                    "type": "speed_controller_move"
                }
            ]
        },
        {
            "kind": "category",
            "name": "Swerve",
            "contents": [
                {
                    "kind": "block",
                    "type": "swerve_drive_settings"
                },
                {
                    "kind": "block",
                    "type": "swerve_drive_angle_offsets"
                },
                {
                    "kind": "block",
                    "type": "four_port_list"
                },
                {
                    "kind": "block",
                    "type": "swerve_drive"
                },
                {
                    "kind": "block",
                    "type": "swerve_drive_movement"
                }
            ]
        }
    ]
}

export default Toolbox;