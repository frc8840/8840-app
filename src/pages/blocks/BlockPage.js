import React, { useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import "./BlockPage.css"
import TillGenerator from './Generator';

import Toolbox from './Toolbox';
import register from './WorkspaceCallbacks';

const theme = {
    componentStyles: {
        'workspaceBackgroundColour': '#1e1e1e',
        'toolboxBackgroundColour': 'blackBackground',
        'toolboxForegroundColour': '#fff',
        'flyoutBackgroundColour': '#252526',
        'flyoutForegroundColour': '#ccc',
        'flyoutOpacity': 1,
        'scrollbarColour': '#797979',
        'insertionMarkerColour': '#fff',
        'insertionMarkerOpacity': 0.3,
        'scrollbarOpacity': 0.4,
        'cursorColour': '#d0d0d0',
        'blackBackground': '#333',
    }
}

function BlockPage() {
    const [xml, setXml] = useState();
    
    const onChange = (event) => {
        const code = TillGenerator.workspaceToCode(event);
        window.generatedCode = code;
    }

    const generateAndSaveCode = () => {
        const start = Date.now();
        const code = window.generatedCode || "";

        //Save code to file
        const element = document.createElement("a");
        const file = new Blob([code], {type: 'text/plain'});
        element.href = URL.createObjectURL(file);
        element.download = "generatedCode.till";

        document.body.appendChild(element); // Required for this to work in FireFox
        element.click();

        console.log("Generated download for code in " + (Date.now() - start) + "ms.");
    }

    return (
        <>
        <BlocklyWorkspace
            className="fill-height" // you can use whatever classes are appropriate for your app's CSS
            toolboxConfiguration={Toolbox} // this must be a JSON toolbox definition
            initialXml={xml}
            onXmlChange={setXml}
            workspaceConfiguration={{
                grid: {
                    spacing: 20,
                    length: 3,
                    colour: '#ccc',
                    snap: true,
                },
                zoom: {
                    controls: true,
                    wheel: true,
                    startScale: 1.0,
                    maxScale: 3,
                    minScale: 0.3,
                    scaleSpeed: 1.2,
                },
                trashcan: true,
                //theme
                theme: theme,
            }}
            onWorkspaceChange={onChange}
        />
        <div className="block-options">
            <button onClick={() => {
                console.log("Generating code...")
                console.log(TillGenerator.workspaceToCode(window.workspace))
            }}>Generate Code</button>
            <button onClick={generateAndSaveCode}>Generate and Save Code</button>
        </div>
        </>
    )
}

export default BlockPage;