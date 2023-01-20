import Blockly from 'blockly';

function register(workspace) {
    workspace.registerButtonCallback('addSpeedControllerVariable', function (button) {
        // Add a new variable to the workspace
        var variableName = Blockly.Variables.generateUniqueName(workspace);
        Blockly.Variables.createVariableButtonHandler(workspace, variableName);
        // Add a new block to the workspace
        var block = workspace.newBlock('speed_controller');
        block.setFieldValue(variableName, 'VAR');
        block.initSvg();
        block.render();
        block.moveBy(100, 100);
    });
}

export default register;