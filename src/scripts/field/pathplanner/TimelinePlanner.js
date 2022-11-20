import { FieldTypes } from "../Field";

class TimelinePlanner {
    constructor(autonomousLength=15) {
        this.generated = [];
        this.state = { 
            timeline: {
                menuOpened: false,
                menu: {
                    x: 0,
                    y: 0,
                    editing: -1,
                    opened: 0,
                },
                lastAddedEvent: 0,
                cancelNextAdd: false,
                generated: [],
                events: [
                    {
                        type: FieldTypes.Timeline.GeneralTime,
                        start: 0,
                        end: autonomousLength,
                        name: "Autonomous",
                    },
                    {
                        type: FieldTypes.Timeline.Drive,
                        start: 0,
                        end: 5,
                        name: "Move"
                    },
                    {
                        type: FieldTypes.Timeline.Rotate,
                        start: 0,
                        end: 0.1,
                        name: "15°"
                    }
                ],
                eventRow: [
                    [FieldTypes.Timeline.GeneralTime],
                    [FieldTypes.Timeline.Wait, FieldTypes.Timeline.Drive],
                    [FieldTypes.Timeline.Rotate]
                ],
                selector: {
                    index: -1,
                    offset: 0,
                    original: {
                        x: 0,
                        y: 0
                    }
                },
                getEventRow(type=FieldTypes.Timeline.GeneralTime) {
                    for (let i = 0; i < this.eventRow.length; i++) {
                        if (this.eventRow[i].includes(type)) {
                            return i;
                        }
                    }
                    return -1;
                },
                move: (movedEventIndex, secondsMoved) => {
                    let movedEvent = this.state.timeline.events[movedEventIndex];
                    const eventRow = this.state.timeline.eventRow[this.state.timeline.getEventRow(movedEvent.type)];
                    const eventsInRow = this.state.timeline.events.filter(event => eventRow.includes(event.type)).sort((a, b) => a.start - b.start);

                    const currentDuration = this.getDuration(movedEvent);

                    const maxLen = this.getDuration(this.state.timeline.events.filter(e => e.type == FieldTypes.Timeline.GeneralTime)[0]);

                    let limited = false;
                    if (secondsMoved < 0) {
                        if (eventsInRow.indexOf(movedEvent) > 0) {
                            const prevEvent = eventsInRow[eventsInRow.indexOf(movedEvent) - 1];
                            if (prevEvent.end > movedEvent.start - secondsMoved) {
                                movedEvent.start = prevEvent.end;
                                movedEvent.end = movedEvent.start + currentDuration;
                                limited = true;
                            }
                        } else if (0 > movedEvent.start - secondsMoved) {
                            movedEvent.start = 0;
                            movedEvent.end = movedEvent.start + currentDuration;
                            limited = true;
                        }
                    } else if (secondsMoved > 0) {
                        if (eventsInRow.indexOf(movedEvent) < eventsInRow.length - 1) {
                            const nextEvent = eventsInRow[eventsInRow.indexOf(movedEvent) + 1];
                            if (nextEvent.start < movedEvent.end + secondsMoved) {
                                movedEvent.end = nextEvent.start;
                                movedEvent.start = movedEvent.end - currentDuration;
                                limited = true;
                            }
                        } else if (maxLen < movedEvent.end + secondsMoved) {
                            movedEvent.end = maxLen;
                            movedEvent.start = movedEvent.end - currentDuration;
                            limited = true;
                        }
                    }

                    if (!limited) {
                        movedEvent.start += secondsMoved;
                        movedEvent.end += secondsMoved;
                    }

                    const newDuration = Math.round(100 * this.getDuration(movedEvent)) / 100;
                    if (newDuration != currentDuration) {
                        movedEvent.end = movedEvent.start + newDuration;
                    }
                },
                moving: {
                    index: -1,
                    offsetFromLeftSide: 0
                }
            },
            keysDown: {},
            playback: {
                currentTimePlayed: 0,
            },
        };

        this.timelineColors = {
            bg: "#404040",
            block: "#636363",
            blockOver: "#525252",
            playback: "#d12a3d"
        }
    }

    getDuration(event) {
        return event.end - event.start;
    }

    getEvents() {
        return this.state.timeline.events;
    }

    updateKeysDown(keysDown) {
        this.state.keysDown = keysDown;
    }

    updateTimePlayed(timePlayed) {
        this.state.playback.currentTimePlayed = timePlayed;
    }

    updateEvents(events) {
        this.state.timeline.events = events;
    }

    draw(ctx, frameCount, rel, canvas, mouse) {
        const tbounds = {
            width: 800,
            height: 200,
            left: 10,
            top: 10,
            paddingHoriz: 4,
            paddingVert: 4,
            inner() {
                return {
                    width: this.width - (this.paddingHoriz * 2),
                    height: this.height - (this.paddingVert * 2),
                    top: this.top + this.paddingVert,
                    left: this.left + this.paddingHoriz
                }
            }
        }

        ctx.fillStyle = this.timelineColors.bg;
        ctx.fillRect(tbounds.left, tbounds.top, tbounds.width, tbounds.height);

        const sectionHeight = 50;
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#bbbbbb";

        let mouseOverSection = -1;

        for (let i = 1; i < 20; i++) {
            const yval = (i * sectionHeight) + ((i - 1) * 2);
            if (yval > tbounds.height) break;
            ctx.beginPath();
            ctx.moveTo(tbounds.left, tbounds.top + yval);
            ctx.lineTo(tbounds.left + tbounds.width, tbounds.top + yval);
            ctx.stroke();

            if (mouse.x > tbounds.left && mouse.x < tbounds.left + tbounds.width && mouse.y > tbounds.top + yval && mouse.y < tbounds.top + yval + sectionHeight) {
                mouseOverSection = i;
            }
        }
        
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";

        const getDuration = this.getDuration;

        const genTimeline = this.state.timeline.events.filter(e => e.type == FieldTypes.Timeline.GeneralTime)[0];

        const timelineWidthPerSecond = tbounds.inner().width / getDuration(genTimeline);

        if (mouseOverSection > -1) {
            if (this.state.keysDown["r"] && this.state.mousePickedUp == -1 && Date.now() - this.state.timeline.lastAddedEvent > 200) {
                const types = this.state.timeline.eventRow[mouseOverSection].join(", ");
                delete this.state.keysDown["r"];
                if (!this.state.timeline.cancelNextAdd) {
                    const type = prompt(`Enter a type of event to add (${types}):`);
                    if (type && this.state.timeline.eventRow[mouseOverSection].includes(type)) {
                        const eventsInRow = this.state.timeline.events.filter(e => e.row == mouseOverSection).sort((a, b) => a.start - b.start);
                        let calculatedStart = (mouse.x - tbounds.inner().left) / timelineWidthPerSecond;
                        let notInEvent = true;
                        for (let evnt of eventsInRow) {
                            if ((calculatedStart >= evnt.start && calculatedStart <= evnt.end) || (calculatedStart + 1 >= evnt.start && calculatedStart + 1 <= evnt.end) || (evnt.start >= calculatedStart && evnt.start <= calculatedStart + 1) || (evnt.end >= calculatedStart && evnt.end <= calculatedStart + 1)) {
                                notInEvent = false;
                                break;
                            }
                        }
                        if (notInEvent) {
                            delete this.state.keysDown["r"];
                            const event = {
                                type: type,
                                name: prompt("Enter a name for the event:"),
                                start: calculatedStart,
                                end: calculatedStart + 1,
                            }
                            delete this.state.keysDown["r"];
                            this.state.timeline.events.push(event);
                            this.state.timeline.lastAddedEvent = Date.now();
                            this.state.timeline.cancelNextAdd = true;
                            console.log("added event", event)
                        }
                    } else {
                        delete this.state.keysDown["r"];
                        alert("Couldn't find type " + type)
                        delete this.state.keysDown["r"];
                        this.state.timeline.cancelNextAdd = true;
                        this.state.timeline.lastAddedEvent = Date.now();
                    }
                } else {
                    this.state.timeline.cancelNextAdd = false;
                    this.state.timeline.lastAddedEvent = Date.now();
                }
            }
        }

        ctx.fillStyle = this.timelineColors.block;
        ctx.fillRect(tbounds.inner().left, tbounds.inner().top, tbounds.inner().width, (sectionHeight - (tbounds.paddingVert * 2)))
        ctx.fillStyle = "white";
        ctx.font = "15px Arial";
        ctx.fillText(`${genTimeline.name} (General, ${getDuration(genTimeline)}s)`, tbounds.inner().left + 10, tbounds.inner().top + 20);

        for (let i = 1; i < this.state.timeline.events.length; i++) {
            const event = this.state.timeline.events[i];
            const row = this.state.timeline.getEventRow(event.type);
            const eventWidth = timelineWidthPerSecond * getDuration(event);
            const left = tbounds.inner().left + (timelineWidthPerSecond * event.start);

            const yval = (row * sectionHeight) + ((row - 1) * 2) + tbounds.inner().top;
            if (yval > tbounds.height) break;
            
            let blkFillStyle = this.timelineColors.block;

            if (mouse.x > left && mouse.x < left + eventWidth && mouse.y > yval && mouse.y < yval + sectionHeight) {
                blkFillStyle = this.timelineColors.blockOver;

                if (mouse.down) {
                    if (this.state.timeline.selector.index == -1) {
                        this.state.timeline.selector.index = i;
                        this.state.timeline.selector.offset = mouse.x - left;
                    } else if (this.state.timeline.selector.index == i) {
                        const currentPosBasedOnSeconds = left + this.state.timeline.selector.offset;
                        const difference = mouse.x - currentPosBasedOnSeconds;
                        const diffInSeconds = difference / (timelineWidthPerSecond * getDuration(event));

                        this.state.timeline.move(i, diffInSeconds);
                    }
                } else if (this.state.timeline.selector.index != -1) {
                    this.state.timeline.selector.index = -1;
                    this.state.timeline.selector.offset = 0;
                }

                if (!mouse.down && this.state.keysDown["e"] && Date.now() - this.state.timeline.menu.opened > 500) {
                    this.state.timeline.menuOpened = !this.state.timeline.menuOpened;
                    this.state.timeline.menu.opened = Date.now();
                    if (this.state.timeline.menuOpened) {
                        this.state.timeline.menu.editing = i;
                        this.state.timeline.menu.x = mouse.x;
                        this.state.timeline.menu.y = mouse.y;
                    }
                    delete this.state.keysDown["e"];
                }
            }
            ctx.fillStyle = blkFillStyle;
            ctx.fillRect(left, yval, eventWidth, (sectionHeight - (tbounds.paddingVert * 2)))

            ctx.lineWidth = 2;
            ctx.strokeStyle = "#bbbbbb";
            ctx.beginPath();
            ctx.moveTo(left, yval);
            ctx.lineTo(left, yval + (sectionHeight - (tbounds.paddingVert * 2)));
            ctx.stroke();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "black";
            
            ctx.fillStyle = "white";
            ctx.font = "15px Arial";
            ctx.fillText(`${event.name} (${event.type}, ${Math.round(getDuration(event) * 100)/100}s)`, left + 10, yval + 20);
        }

        //Draw line where current time is on the timeline -- time marker
        ctx.strokeStyle = this.timelineColors.playback;
        ctx.lineWidth = 3;
        ctx.beginPath();
        const timePlaying = (this.state.playback.currentTimePlayed / 1000); // since it's in milliseconds, need to be in seconds.
        ctx.moveTo(tbounds.inner().left + (timelineWidthPerSecond * timePlaying), tbounds.inner().top);
        ctx.lineTo(tbounds.inner().left + (timelineWidthPerSecond * timePlaying), tbounds.inner().top + tbounds.inner().height);
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "black";

        //display the timeline menu editor if it's opened.
        if (this.state.timeline.menuOpened) {
            ctx.fillStyle = "rgb(52,52,52)";
            ctx.fillRect(this.state.timeline.menu.x, this.state.timeline.menu.y, 200, 100);
            //format is [name, get lambda, editable, set lambda if editable?]
            let menu = [["Type", (event) => event.type, false, (value, event) => {}], ["Name", (event) => event.name, true, (value, event) => {event.name = value;}], ["Start", (event) => event.start, true, (value, event) => {
                const newStart = parseFloat(value);
                if (newStart < event.end) {
                    event.start = newStart;
                }
            }], ["End", (event) => event.end, true, (value, event) => {
                const newEnd = parseFloat(value);
                if (newEnd > event.start) {
                    event.end = newEnd;
                }
            }]];
            for (let i = 0; i < menu.length; i++) {
                ctx.fillStyle = "white";
                if (menu[i][2] && mouse.x < this.state.timeline.menu.x + 200 && mouse.x > this.state.timeline.menu.x && mouse.y > this.state.timeline.menu.y + 5 + (i * 20) && mouse.y < this.state.timeline.menu.y + 20 + (i * 20)) {
                    ctx.fillStyle = "rgb(255,255,255)";
                    ctx.fillRect(this.state.timeline.menu.x + 5, this.state.timeline.menu.y + 5 + (i * 20), 190, 20);
                    ctx.fillStyle = "black";
                    
                    if (mouse.down) {
                        const newValue = prompt(`Enter a new value for ${menu[i][0]}`, menu[i][1](this.state.timeline.events[this.state.timeline.menu.editing]));
                        if (newValue != null) {
                            menu[i][3](newValue, this.state.timeline.events[this.state.timeline.menu.editing]);
                        }
                        this.state.timeline.menuOpened = false;
                        mouse.cancelMouseDown();
                    }
                }
                ctx.font = "15px Arial";
                ctx.fillText(menu[i][0] + ": " + menu[i][1](this.state.timeline.events[this.state.timeline.menu.editing]), this.state.timeline.menu.x + 10, this.state.timeline.menu.y + 20 + (i * 20));
            }
        }
    }
}

export default TimelinePlanner;