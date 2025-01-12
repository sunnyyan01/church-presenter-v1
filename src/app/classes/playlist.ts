import { Type } from "@angular/core";
import { TextReader } from "./utils";

const dashJoin = (...arr: Array<string>) => arr.filter(x => x).join(" - ");

export class Slide {
    template = "";
    id = "";
    idx = -1;
    subslides: Array<string>;
    preview;
    hasPlayback = false;

    constructor(data: Record<string, any>) {
        this.id = data['id'];
        this.idx = data['idx'];
        this.template = data['template'];
        this.subslides = data['subslides'] || [];
        this.preview = data['preview'] || '';
    }

    get subslideCount(): number {
        return this.subslides.length;
    }
}

export class WelcomeSlide extends Slide {
    year = "";
    month = "";
    day = "";

    constructor(data: Record<string, any>) {
        super(data);
        this.year = data['year'];
        this.month = data['month'];
        this.day = data['day'];
        if (!data['preview'])
            this.preview = dashJoin(this.year, this.month, this.day);
    }
}

export class BibleSlide extends Slide {
    title = "";
    location = "";

    constructor(data: Record<string, any>) {
        super(data);
        this.title = data['title'];
        this.location = data['location'];
        if (!this.preview)
            this.preview = dashJoin(this.title, this.location);
    }
}

export class SongSlide extends Slide {
    title = "";
    name = "";

    constructor(data: Record<string, any>) {
        super(data);
        this.title = data['title'];
        this.name = data['name'];
        if (!this.preview)
            this.preview = dashJoin(this.title, this.name);
    }
}

export class TitleSlide extends Slide {
    title = "";
    subtitle = "";

    constructor(data: Record<string, any>) {
        super(data);
        this.title = data['title'] || "";
        this.subtitle = data['subtitle'] || "";
        if (!this.preview)
            this.preview = dashJoin(this.title, this.subtitle);
    }
}

export class EmbedSlide extends Slide {
    url;
    _subslideCount;

    constructor(data: Record<string,any>) {
        super(data);
        this.url = data['url'];
        this._subslideCount = data['subslideCount'] || 0;
        if (!this.preview) this.preview = this.url;
    }

    override get subslideCount(): number {
        return this._subslideCount;
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
        this.videoId = data['videoId'];
        this.start = data['start'];
        this.end = data['end'];
        this.subtitles = data['subtitles'] || "";
    }
}

export class BlankSlide extends Slide {
    constructor() {
        super({"template": "blank"});
    }
}

const SLIDE_CONSTRUCTORS: Record<string, any> = {
    welcome: WelcomeSlide,
    bible: BibleSlide,
    song: SongSlide,
    title: TitleSlide,
    embed: EmbedSlide,
    youtube: YoutubeSlide,
    blank: BlankSlide,
}

const TEMPLATES: Array<[string, Array<string>]> = [
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
    name = "";

    [Symbol.iterator]() {
        return Object.values(this.slides).values();
    }

    byId(id: string) {
        return this.slides[id];
    }
    byIdx(idx: number) {
        return Object.values(this.slides)[idx];
    }

    pushSlide(slide: Record<string, any>) {
        let curId = this.nextId++;
        slide['id'] = curId.toString();
        slide['idx'] = curId;
        let constructor = SLIDE_CONSTRUCTORS[slide['template']];
        this.slides[curId] = new constructor(slide);
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