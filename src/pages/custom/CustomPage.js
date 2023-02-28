import React from "react";
import CustomComponent from "../../scripts/custom/CustomComponent";
import Mover from "../../scripts/mover/Mover";

import "./CustomPage.css";

const requestPath = "/custom_modules";

window.customModuleKey = (function* () {
    let id = 0;

    while (true) {
        yield id++;
    }
})();

class CustomPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            modules: [],
            savedContent: null,
            callAmount: -1,
        }
    }
    
    async getContent() {
        if (this.state.savedContent != null) {
            return this.state.savedContent;
        }

        const robotServer = window.nt.host + ":" + window.nt.port;

        console.log("Fetching from " + robotServer + requestPath + "...")

        let response;
        try {
            response = await fetch("http://" + robotServer + requestPath);
        } catch (e) {
            console.error("Failed to fetch custom modules: " + e);
            return null;
        }
 
        if (response.ok) {
            const data = await response.json();

            this.state.savedContent = data;
            
            return data;
        }

        return null;
    }

    async componentDidMount() {
        this.state.callAmount += 1;
        if (this.state.callAmount % 2 == 1) {
            // console.log("aksjdgnlsadglkasjdg ")
             return;
        }

        this.state.modules = [];

        const data = await this.getContent();

        if (data) {
            const names = data[".info"].names;

            for (let name of names) {
                const moduleInfo = data[name];

                if (document.getElementById(name + "-parent")) {
                    // console.log("skoppjaoisdgnj")
                    continue;
                }

                this.state.modules.push((
                    <div id={name + "-parent"} className={"custom-built-module"} key={window.customModuleKey.next().value + "-custom-component-holder"}>
                        <Mover target={name + "-parent"}/>
                        <CustomComponent raw={moduleInfo} key={window.customModuleKey.next().value + "-custom-component"}/>
                    </div>
                ))
            }

            this.setState(this.state);
        }
    }

    render() {
        return (
            <>
                {this.state.modules}
            </>
        )
    }
}

export default CustomPage;