
class PathFileLoader {
    static {
        window.PathFileLoader = new PathFileLoader();
    }

    constructor() {
        this.timelineEvents = [];
        this.name = "no_name";
        this.trajectorySettings = {};
        this.positions = [];
        this.generatedTimeline = [];

        this.loadFile = this.loadFile.bind(this);

        this.loaded = false;
    }
    loadFile(callback=() => {}) {
        //Trigger file picker
        //Read file
        //Parse file
        //Return parsed file

        let input = document.createElement('input');
        input.type = 'file';

        input.onchange = (e) => { 
            const file = e.target.files[0];

            //Change to text reader
            let reader = new FileReader();
            reader.readAsText(file, 'UTF-8');

            reader.onload = readerEvent => {
                let content = readerEvent.target.result;
                let parsed = JSON.parse(content);

                this.name = parsed.name;
                this.trajectorySettings = parsed.trajectorySettings;
                this.positions = parsed.positions;
                this.generatedTimeline = parsed.generatedTimeline;
                this.timelineEvents = parsed.timelineEvents;

                this.loaded = true;

                callback(this);
            }
        }

        input.click();
    }
}

export default PathFileLoader;