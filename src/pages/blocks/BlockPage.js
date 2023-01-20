import React, { useState } from 'react';
import { BlocklyWorkspace } from 'react-blockly';
import "./BlockPage.css"

import Toolbox from './Toolbox';
import register from './WorkspaceCallbacks';

function BlockPage() {
    const [xml, setXml] = useState();

    return (
        <BlocklyWorkspace
            className="fill-height" // you can use whatever classes are appropriate for your app's CSS
            toolboxConfiguration={Toolbox} // this must be a JSON toolbox definition
            initialXml={xml}
            onXmlChange={setXml}
        />
    )
}

export default BlockPage;