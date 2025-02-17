import { Type } from "@angular/core";
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
        console.log(data['template'])
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
const SUBSLIDE_TEMPLATES_A = ["bible", "song"];
const SUBSLIDE_TEMPLATES_B = ["embed"];

export class Playlist {
    nextId = 0;
    slides: Record<string, Slide> = {};
    slideOrder: Array<string> = [];
    name = "";

    [Symbol.iterator]() {
        return this.slideOrder.map(id => this.slides[id]).values();
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

    toJson(space: number | string) {
        let slides: Array<Record<string, any>> = this.slideOrder.map(id => this.slides[id]);
        for (let slide of slides) {
            delete slide['id'];
            delete slide['idx'];
        }
        return JSON.stringify(slides, undefined, space);
    }

    static fromText(text: string) {
        let playlist = new Playlist();

        let reader = new TextReader(text);
        let curSlide: Record<string, any> = {};
        while (reader.canRead) {
            let readResult = reader.read().match(/(\\.|[^,])+/g);
            if (!readResult) throw new Error();
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

            if (SUBSLIDE_TEMPLATES_A.includes(templateName)) {
                curSlide['subslides'] = ["<Title Subslide>"];
                let subslide = "";
                do {
                    subslide += reader.read() + "\n";
                    if (reader.lastRead?.match(/(N|E)$/)) {
                        curSlide['subslides'].push(subslide.slice(0, -2)); // Remove N|E and \n
                        subslide = "";
                    }
                } while (!reader.lastRead?.endsWith("E"));
            } else if (SUBSLIDE_TEMPLATES_B.includes(templateName)) {
                curSlide['numSubslides'] = 1;
            }

            if (!curSlide['preview']) {
                curSlide['preview'] = positionalArgs
                    .slice(0, positionalsMatched)
                    .map(key => curSlide[key])
                    .join(" - ");
            }

            console.log(curSlide);

            playlist.pushSlide(curSlide);
            curSlide = {};
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
        return playlist;
    }
}