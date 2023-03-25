const path = "/files"

class FileSystem {
    static instance = null;

    static {
        console.log("[FileSystem] FileSystem is initializing...")

        FileSystem.instance = new FileSystem();

        window.fs = FileSystem.instance;
    }

    static FileType = {
        Log: "logs",
        Path: "paths"
    }

    constructor() {
        this.logfiles = {};
        this.pathfiles = {};

        this.folderBase = "";
    }

    getAllFiles() {
        const files = [];
        for (const key in this.logfiles) {
            const file = this.logfiles[key];
            const copy = Object.assign(Object.assign({}, file), {
                path: "8840applogs/" + file.path
            })
            files.push(copy);
        }

        for (const key in this.pathfiles) {
            const file = this.pathfiles[key];
            const copy = Object.assign(Object.assign({}, file), {
                path: "8840appdata/" + file.path
            })
            files.push(copy);
        }

        return files;
    }

    async updateFiles() {
        const rawLogFiles = await this.requestFiles(FileSystem.FileType.Log);
        const rawPathFiles = await this.requestFiles(FileSystem.FileType.Path);

        this.logfiles = {};
        this.pathfiles = {};

        for (const file of rawLogFiles) {
            const name = file.name;
            const size = file.size;
            const rawPath = file.path;

            const home = rawPath.split("8840applogs/")[0];
            const path = rawPath.substring(home.length + "8840applogs/".length);

            this.logfiles[path] = {
                name: name,
                size: size,
                path: path
            }

            this.folderBase = home;
        }

        for (const file of rawPathFiles) {
            const name = file.name;
            const size = file.size;
            const rawPath = file.path;

            const home = rawPath.split("8840appdata/")[0];
            const path = rawPath.substring(home.length + "8840appdata/".length);

            this.pathfiles[path] = {
                name: name,
                size: size,
                path: path
            }

            this.folderBase = home;
        }
    }
    async requestFiles(type=FileSystem.FileType.Log) {
        const base = "http://" + window.nt.host + ":" + window.nt.port + path;

        const req = await fetch(base, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                folder: type
            })
        });

        // if (req.status !== 200) {
        //     throw new Error("Failed to fetch files");
        // }
        
        const files = await req.json();

        if (!files.success) throw new Error("Failed to fetch files");

        return files.files;
    }

    async writeFile(_path, rawData) {
        const base = "http://" + window.nt.host + ":" + window.nt.port + path;

        const base64Data = btoa(rawData);

        const req = await fetch(base, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                path: _path,
                data: base64Data
            })
        });

        const data = await req.json();

        if (!data.success) throw new Error("Failed to write files");

        return data;
    }

    async readFile(_path) {
        const base = "http://" + window.nt.host + ":" + window.nt.port + path;

        const req = await fetch(base, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                path: _path
            })
        });

        const data = await req.json();
        
        if (!data.success) throw new Error("Failed to read files");

        return data.data;
    }

    async mkdir(_path) {
        const base = "http://" + window.nt.host + ":" + window.nt.port + path;

        const req = await fetch(base, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                path: _path,
                data: "FOLDER"
            })
        });

        const data = await req.json();

        if (!data.success) throw new Error("Failed to create folder");

        return data;
    }
}

export default FileSystem;