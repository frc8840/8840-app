import React from "react";
import Mover from "../mover/Mover";
import Icon from "@mdi/react";
import { 
    mdiFolderSearch, //ICON
    mdiFolder, //Folders
    mdiSineWave, //Paths
    mdiTextBoxMultiple, //Logs
    mdiFileCogOutline, //Config (YAML, XML, etc.)
    mdiFileQuestion, //Other
    mdiArrowLeft, //Back
    mdiFileUpload, //Upload
    mdiFolderPlus, //New Folder
    mdiRefresh //Refresh
} from "@mdi/js";

import FileSystem from "./FileSystem";

import "./Finder.css";

class File extends React.Component {
    static IconsAssingment = {
        Folder: [ ],
        Path: [ "json" ],
        Log: [ "baydat" ],
        Config: [ "yaml", "xml" ],
        //Other not included since it'll just be the default
    }

    constructor(props) {
        super(props);

        this.state = {
            name: this.props.name || "Untitled",
            extension: (this.props.name || "t.txt").split(".")[1],
            size: this.props.size || "0",
            folder: this.props.folder || false,
            back: this.props.back || false,
            path: this.props.path || ""
        }

        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        if (this.state.folder || this.state.back) {
            const splitUpPath = this.state.path.split("/");
            window.changeFolder(splitUpPath[splitUpPath.length - 1]);
        } else {
            window.openFile(this.state.path);
        }
    }

    componentDidMount() {
        const file = document.getElementById("file-" + this.props.id);
        file.addEventListener("click", this.onClick);
    }

    componentWillUnmount() {
        const file = document.getElementById("file-" + this.props.id);
        file.removeEventListener("click", this.onClick);
    }

    render() {
        const iconSize = 0.8;
        let icon = this.state.folder ? (<Icon path={mdiFolder} size={iconSize} />) : (<Icon path={mdiFileQuestion} size={iconSize} />);

        icon = this.state.back ? (<Icon path={mdiArrowLeft} size={iconSize} />) : icon;
        
        for (let key in File.IconsAssingment) {
            if (File.IconsAssingment[key].includes(this.state.extension)) {
                switch (key) {
                    case "Path":
                        icon = (<Icon path={mdiSineWave} size={iconSize} />);
                        break;
                    case "Log":
                        icon = (<Icon path={mdiTextBoxMultiple} size={iconSize} />);
                        break;
                    case "Config":
                        icon = (<Icon path={mdiFileCogOutline} size={iconSize} />);
                    default:
                        break;
                }
            }
        }

        return (
            <div className="finder-file" id={"file-" + this.props.id}>
                <div className="finder-file-leftside">
                    {icon}
                    <p>{this.state.name}</p>
                </div>
                <p>{this.state.size}</p>
            </div>
        )
    }
}

window.fileViewFactory = (function* () {
    let i = 0;
    while (true) {
        yield i++;
    }
})();

class Finder extends React.Component {
    constructor(props) {
        super(props);

        const f = async () => {
            console.log("[Finder] Getting Files...")
            await window.fs.updateFiles();
            
            const homeFolder = document.getElementById("home-folder");
            homeFolder.textContent = window.fs.folderBase;

            this.forceUpdate();
        }

        this.state = {
            in_folder: []
        }

        setTimeout(() => {
            f();
        }, 100);

        window.changeFolder = (folder) => {
            if (folder == "..") {
                this.state.in_folder.pop();
            } else {
                this.state.in_folder.push(folder);
            }

            this.forceUpdate();
        }

        window.openFile = async (file) => {
            const raw = await window.fs.readFile(file);
            const data = atob(raw);

            const name = file.split("/")[file.split("/").length - 1];

            //Open in about:blank
            const win = window.open("about:blank", "_blank");

            win.document.write(`
                <html>
                    <head>
                        <title>${name}</title>
                        <style>
                            body {
                                background-color: #1e1e1e;
                                color: #fff;
                                font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
                                overflow-y:visible;
                                width: 100vw;
                                font-size: 12px;
                            }

                            pre {
                                white-space: pre-wrap;
                                word-wrap: break-word;
                                overflow-y: visible;
                            }
                        </style>
                    </head>
                    <body>
                        <pre>${data}</pre>
                    </body>
                </html>
            `);
            
        }

        this.getFilesInFolder = this.getFilesInFolder.bind(this);
        this.sendFile = this.sendFile.bind(this);
    }
    getFilesInFolder() {
        //This goes through the files and returns the ones that are in the current folder
        if (this.state.in_folder.length == 0) {
            //return the folders
            return [
                {
                    name: "logs",
                    size: Object.keys(window.fs.logfiles).length + " files",
                    path: "8840applogs",
                    folder: true,
                    back: false
                },
                {
                    name: "paths",
                    size: Object.keys(window.fs.pathfiles).length + " files",
                    path: "8840appdata",
                    folder: true,
                    back: false,
                },
            ]
        }

        const files = [
            
        ];

        const folders = new Set();

        let hasDepthOfNext = false;
        
        const greaterDepths = [];

        //Go through the files and return the ones that are in the current folder
        for (const file of window.fs.getAllFiles()) {
            if (!file.path.startsWith(this.state.in_folder.join("/") + "/")) {
                continue;
            }

            const path = file.path.split("/");

            const depth = path.length - 2;
            const folder = path[depth];

            if (depth < this.state.in_folder.length - 1) {
                console.log(depth, path);
                continue;
            }

            if (depth == this.state.in_folder.length) {
                folders.add(folder);

                continue;
            }

            if (depth > this.state.in_folder.length) {
                greaterDepths.push(file);
                hasDepthOfNext = true;
                continue;
            }
            
            if (this.state.in_folder.length == 1) {
                files.push(Object.assign(file, {
                    size: file.size + " bytes",
                }));
                continue;
            }

            if (folder == this.state.in_folder[this.state.in_folder.length - 1]) {
                files.push(file);
            }
        }

        if (hasDepthOfNext) {
            for (const file of greaterDepths) {
                const path = file.path.split("/");
                const depth = path.length - 2;

                if (depth > this.state.in_folder.length - 1) {
                    folders.add(path[this.state.in_folder.length]);
                }
            }
        }

        const formattedFolders = [];

        for (const folder of folders) {
            formattedFolders.push({
                name: folder,
                size: "-",
                path: folder,
                folder: true,
                back: false
            });
        }

        const concatFiles = [
            {
                name: "..",
                size: "-",
                path: "..",
                folder: false,
                back: true
            },
            ...formattedFolders,
            ...files
        ]

        return concatFiles;
    }

    sendFile() {
        if (this.state.in_folder.length == 0) {
            alert("You cannot send files from the root directory.")
            return;
        }

        //Create a file input
        const input = document.createElement("input");
        input.type = "file";
        input.style.display = "none";

        input.onchange = async (e) => {
            //Get file name
            const file = e.target.files[0];
            const name = file.name;

            //get file type
            const type = file.type;

            const nameChange = prompt("What would you like to name the file?", name);

            if (nameChange == null) {
                return;
            }

            //Get file data
            const reader = new FileReader();
            reader.readAsArrayBuffer(file);

            reader.onload = async (e) => {
                const data = e.target.result;

                console.log("Writing to " + this.state.in_folder.join("/") + "/" + nameChange + "...");

                //convert data to string
                const dataString = String.fromCharCode.apply(null, new Uint8Array(data));

                //Send file
                await window.fs.writeFile(
                    this.state.in_folder.join("/") + "/" + nameChange, 
                    //String
                    dataString,
                );

                //Update files
                await window.fs.updateFiles();

                //Update UI
                this.forceUpdate();
            }
        }

        input.click();
        input.remove();
    }

    render() {
        const files = [];

        for (let file of this.getFilesInFolder()) {
            const v = window.fileViewFactory.next().value;

            files.push(
                <File  
                    name={file.name} 
                    size={file.size} 
                    path={file.path}
                    key={`file-${v}`}
                    id={`file-${v}`}
                    folder={file.folder} back={file.back}
                />
            );
        }

        return (
            <div id="finder-parent">
                <Mover target="finder-parent"></Mover>
                <div id="finder-header">
                    <div id="finder-title">
                        <Icon path={mdiFolderSearch} size={1} />
                        <p>Finder • <span id="home-folder"></span><span id="folder-additions">{this.state.in_folder.join("/")}</span></p>
                    </div>
                    <div id="finder-tools">
                        <div onClick={() => {
                            window.fs.updateFiles();
                            this.forceUpdate();
                        }}>
                            <Icon path={mdiRefresh} size={1} />
                        </div>
                        <div onClick={this.sendFile}>
                            <Icon path={mdiFileUpload} size={1} />
                        </div>
                        <div onClick={() => {
                            console.log("oi do this! or make it do stuff.")
                        }}>
                            <Icon path={mdiFolderPlus} size={1} />
                        </div>
                    </div>
                </div>
                <div id="finder-viewer">
                    {files}
                </div>
            </div>
        )
    }
}

export default Finder;