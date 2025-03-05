import { TextReader } from "./utils";

const dashJoin = (...arr: Array<string>) => arr.filter(x => x).join(" - ");

export abstract class Slide {
    template = "";
    id = "";
    idx = -1;
    preview;
    hasPlayback = false;

    constructor(data: Record<string, any>) {
        this.id = data['id'];
        this.idx = data['idx'];
        this.template = data['template'];
        this.preview = data['preview'] || '';
    }

    static fromRecord(data: Record<string, any>) {
        return new SLIDE_CONSTRUCTORS[data['template']](data);
    }

    get subslideCount(): number {
        return 0;
    }

    [Symbol.iterator]() {
        return Object.entries(this).values();
    }

    abstract resetPreview(): string;
}

export class WelcomeSlide extends Slide {
    year;
    month;
    day;

    constructor(data: Record<string, any>) {
        super(data);
        this.year = data['year'] || "";
        this.month = data['month'] || "";
        this.day = data['day'] || "";
        if (!data['preview']) this.resetPreview();
    }

    resetPreview() {
        this.preview = dashJoin(this.year, this.month, this.day);
        return this.preview;
    }
}

export class BibleSlide extends Slide {
    title = "";
    location = "";
    version = "";
    subslides: Array<string>;

    constructor(data: Record<string, any>) {
        super(data);
        this.title = data['title'] || "";
        this.location = data['location'] || "";
        this.version = data['version'] || "";
        this.subslides = data['subslides'] || [];
        if (!this.preview) this.resetPreview();
    }

    override get subslideCount(): number {
        return this.subslides.length;
    }

    resetPreview() {
        this.preview = dashJoin(this.title, this.location);
        return this.preview;
    }

    toTitleSlide() {
        return new TitleSlide({
            title: this.title,
            subtitle: this.location,
        })
    }
}

export class SongSlide extends Slide {
    title = "";
    name = "";
    subslides: Array<string>;

    constructor(data: Record<string, any>) {
        super(data);
        this.title = data['title'] || "";
        this.name = data['name'] || "";
        this.subslides = data['subslides'] || [];
        if (!this.preview) this.resetPreview();
    }

    override get subslideCount(): number {
        return this.subslides.length;
    }

    override resetPreview() {
        this.preview = dashJoin(this.title, this.name);
        return this.preview;
    }

    toTitleSlide() {
        return new TitleSlide({
            title: this.title,
            subtitle: this.name,
        })
    }
}

export class TitleSlide extends Slide {
    title = "";
    subtitle = "";

    constructor(data: Record<string, any>) {
        super(data);
        this.title = data['title'] || "";
        this.subtitle = data['subtitle'] || "";
        if (!this.preview) this.resetPreview();
    }

    override resetPreview() {
        this.preview = dashJoin(this.title, this.subtitle);
        return this.preview;
    }
}

export class EmbedSlide extends Slide {
    url;
    _subslideCount;

    constructor(data: Record<string,any>) {
        super(data);
        this.url = data['url'] || "";
        this._subslideCount = data['subslideCount'] || 0;
        if (!this.preview) this.resetPreview();
    }

    override get subslideCount(): number {
        return this._subslideCount;
    }

    override resetPreview() {
        this.preview = this.url;
        return this.preview;
    }
}

export class YoutubeSlide extends Slide {
    videoId;
    start;
    end;
    subtitles;
    override hasPlayback = true;

    constructor(data: Record<string,any>) {
        super(data);
        this.videoId = data['videoId'] || "";
        this.start = data['start'] || "";
        this.end = data['end'] || "";
        this.subtitles = data['subtitles'] || "";
        if (!this.preview) this.resetPreview();
    }

    override resetPreview() {
        this.preview = this.videoId;
        return this.preview;
    }
}

export class BlankSlide extends Slide {
    constructor() {
        super({"template": "blank"});
    }

    override resetPreview(): string {
        return this.preview;
    }
}

export const SLIDE_CONSTRUCTORS: Record<string, any> = {
    welcome: WelcomeSlide,
    bible: BibleSlide,
    song: SongSlide,
    title: TitleSlide,
    embed: EmbedSlide,
    youtube: YoutubeSlide,
    blank: BlankSlide,
}

export const TEMPLATES: Array<[string, Array<string>]> = [
    ["welcome", ["year", "month", "day"]],
    ["bible", ["title", "location"]],
    ["song", ["title", "name"]],
    ["title", ["title", "subtitle"]],
    ["embed", ["url"]],
    ["youtube", ["videoId"]],
]

export class Playlist {
    nextId = 0;
    slides: Record<string, Slide> = {};
    slideOrder: Array<string> = [];
    name = "";

    [Symbol.iterator]() {
        let x = this.slideOrder.map(id => this.slides[id])
        return x.values();
    }

    byId(id: string) {
        return this.slides[id];
    }
    byIdx(idx: number) {
        return this.slides[this.slideOrder[idx]];
    }

    pushSlide(slide: Record<string, any>) {
        let curId = this.nextId++;
        slide['id'] = curId.toString();
        if (!slide['idx']) slide['idx'] = this.slideOrder.length;
        let constructor = SLIDE_CONSTRUCTORS[slide['template']];
        this.slides[curId] = new constructor(slide);
        if (slide['idx']) {
            this.slideOrder.splice(slide['idx'], 0, slide['id']);
        } else {
            this.slideOrder.push(slide['id']);
        }
    }

    replaceSlide(slide: Record<string, any>) {
        let constructor = SLIDE_CONSTRUCTORS[slide['template']];
        this.slides[slide['id']] = new constructor(slide);
    }

    moveSlide(slideId: string, direction: 1 | -1) {
        let slide = this.byId(slideId);
        let curIdx = slide.idx;
        if (direction == -1 && curIdx == 0) return;
        if (direction == 1 && curIdx == this.slideOrder.length - 1) return;
        let newIdx = curIdx + direction;

        let temp = this.slideOrder[curIdx];
        this.slideOrder[curIdx] = this.slideOrder[newIdx];
        this.slideOrder[newIdx] = temp;

        this.byIdx(curIdx).idx = curIdx;
        this.byIdx(newIdx).idx = newIdx;
    }

    deleteSlide(slideId: string) {
        let idx = this.byId(slideId).idx;
        delete this.slides[slideId];
        this.slideOrder.splice(idx, 1);
        for (let i = 0; i < this.slideOrder.length; i++) {
            let id = this.slideOrder[i];
            this.slides[id].idx = i;
        }
    }

    toJson(space: number | string) {
        let slides: Array<Record<string, any>> = this.slideOrder.map(id => this.slides[id]);
        for (let slide of structuredClone(slides)) {
            delete slide['id'];
            delete slide['idx'];
        }
        return JSON.stringify(slides, undefined, space);
    }

    toText() {
        let slides: Array<Record<string, any>> = this.slideOrder.map(id => this.slides[id]);
        let text = "";

        for (let slide of structuredClone(slides)) {
            delete slide['id'];
            delete slide['idx'];

            let templateNum = TEMPLATES.findIndex(t => t[0] == slide['template']);

            let args = [ templateNum.toString() ];

            // Positional args
            for (let arg of TEMPLATES[templateNum][1]) {
                args.push(slide[arg]);
                delete slide[arg];
            }

            // Keyword args
            for (let [key, val] of Object.entries(slide)) {
                if (key == 'subslides') continue;
                args.push(`${key}=${val}`);
            }

            text += args.join(",") + "\n";

            // Subslides
            if (slide['subslides']) {
                text += "S\n";
                for (let subslide of slide['subslides']) {
                    text += subslide + "N\n";
                }
                text += "E\n";
            }
        }

        return text;
    }

    static fromText(text: string, name?: string) {
        let playlist = new this();
        playlist.name = name || "";

        let reader = new TextReader(text);
        let curSlide: Record<string, any> = {};
        let subslide = [];
        let readingSubslides = false;
        while (reader.canRead) {
            let line = reader.read();

            if (readingSubslides) {
                if (line == "E") {
                    curSlide['subslides'].push(subslide.join("\n"));
                    readingSubslides = false;
                } else {
                    if (line.endsWith("N")) {
                        subslide.push(line.trim().replace(/N$/,""));
                        curSlide['subslides'].push(subslide.join("\n"));
                        subslide = [];
                    } else {
                        subslide.push(line.trim());
                    }
                }
            } else if (line == "S") {
                readingSubslides = true;
                curSlide['subslides'] = [];
            } else {
                // Push last slide
                if (curSlide['template']) {
                    playlist.pushSlide(curSlide);
                    curSlide = {};
                }

                // Reading slide line
                let readResult = line.match(/(\\.|[^,])+/g);
                if (!readResult)
                    throw new Error(`Error reading line ${reader.idx}`);
                let [template, ...args] = readResult;
                let templateNum = parseInt(template);

                let [templateName, positionalArgs] = TEMPLATES[templateNum];
                let positionalsMatched = 0;

                curSlide['template'] = templateName;

                for (let arg of args) {
                    if (arg.includes("=")) {
                        let [key, val] = arg.split("=");
                        curSlide[key] = val;
                    } else {
                        let key = positionalArgs[positionalsMatched++];
                        curSlide[key] = arg;
                    }
                }

                if (!curSlide['preview']) {
                    curSlide['preview'] = positionalArgs
                        .slice(0, positionalsMatched)
                        .map(key => curSlide[key])
                        .join(" - ");
                }
            }
        }

        // Push last slide
        if (curSlide['template']) {
            playlist.pushSlide(curSlide);
        }

        return playlist;
    }

    static fromJson(json: string, name?: string) {
        let playlist = new this();
        playlist.name = name || "";
        let slides: Array<Record<string,any>> = Object.values(JSON.parse(json));
        for (let slide of slides) {
            playlist.pushSlide(slide);
        }
        console.log(playlist);
        return playlist;
    }
}