import { OrderedDict, TextReader } from "./utils";

const dashJoin = (...arr: Array<string>) => arr.filter(x => x).join(" - ");

export abstract class PlaylistItem {
    type = "";
    subtype = "";

    constructor(data: Record<string, any>) {
        this.type = data['type'];
        this.subtype = data['subtype'];
    }

    static fromRecord(data: Record<string, any>) {
        return new CONSTRUCTORS[data['type'] + data['subtype']](data);
    }
}

export abstract class Slide extends PlaylistItem {
    id = "";
    idx = -1;
    preview;

    constructor(data: Record<string, any>) {
        super(data);
        this.id = data['id'];
        this.idx = data['idx'];
        this.preview = data['preview'] || '';
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
    title_tr = "";
    location = "";
    location_tr = "";
    version = "";
    subslides: Array<string>;

    constructor(data: Record<string, any>) {
        super(data);
        this.title = data['title'] || "";
        this.title_tr = data['title_tr'] || "";
        this.location = data['location'] || "";
        this.location_tr = data['location_tr'] || "";
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

export class BlankSlide extends Slide {
    constructor() {
        super({"type": "slide", "subtype": "blank"});
    }

    override resetPreview(): string {
        return this.preview;
    }
}

export abstract class Media extends PlaylistItem {
    id = "";
    idx = -1;
    preview = "";

    constructor(data: Record<string,any>) {
        super(data);
        this.id = data['id'];
        this.idx = data['idx'];
        this.preview = data['preview'] || '';
    }

    abstract resetPreview(): string;
}

export class YoutubeMedia extends Media {
    videoId;
    start;
    end;
    subtitles;

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

export class VideoMedia extends Media {
    videoSrc;
    start;
    end;
    subtitleSrc;

    constructor(data: Record<string, any>) {
        super(data);
        this.videoSrc = data['videoSrc'] || "";
        this.start = data['start'] || "";
        this.end = data['end'] || "";
        this.subtitleSrc = data['subtitleSrc'] || "";
        if (!this.preview) this.resetPreview();
    }

    override resetPreview() {
        this.preview = this.videoSrc;
        return this.preview;
    }
}

export class BlankMedia extends Media {
    constructor() {
        super({"type": "media", "subtype": "blank"});
    }

    override resetPreview(): string {
        return this.preview;
    }
}

export const CONSTRUCTORS: Record<string, any> = {
    slidewelcome: WelcomeSlide,
    slidebible: BibleSlide,
    slidesong: SongSlide,
    slidetitle: TitleSlide,
    slideembed: EmbedSlide,
    slideblank: BlankSlide,
    mediayoutube: YoutubeMedia,
    mediavideo: VideoMedia,
    mediablank: BlankMedia,
}

export const TEMPLATES: Array<[string, string, Array<string>]> = [
    ["slide", "welcome", ["year", "month", "day"]],
    ["slide", "bible", ["title", "location"]],
    ["slide", "song", ["title", "name"]],
    ["slide", "title", ["title", "subtitle"]],
    ["media", "video", ["videoSrc"]],
    ["media", "youtube", ["videoId"]],
]

export class Playlist {
    slides: OrderedDict<Slide> = new OrderedDict<Slide>();
    media: OrderedDict<Media> = new OrderedDict<Media>();
    name = "New Playlist";
    modified = false;

    isBlank() {
        return !(this.slides.length || this.media.length);
    }

    push(item: PlaylistItem) {
        this.modified = true;
        if (item.type == "slide")
            this.slides.push(item as Slide);
        else /* media */
            this.media.push(item as Media);
    }
    replace(item: PlaylistItem) {
        this.modified = true;
        if (item.type == "slide")
            this.slides.replace(item as Slide);
        else /* media */
            this.media.replace(item as Media);
    }
    touch() {
        this.modified = true;
    }

    prevSlide(id: string, subslideIdx: number, skip?: boolean): [string, number] {
        let curSlide = this.slides.byId(id);
        if (!skip && subslideIdx > 0) {
            return [id, subslideIdx - 1];
        } else if (curSlide.idx > 0) {
            let prevSlide = this.slides.byIdx(curSlide.idx - 1);
            return [prevSlide.id, 0];
        }
        return ["", 0];
    }
    nextSlide(id: string, subslideIdx: number, skip?: boolean): [string, number] {
        let curSlide = this.slides.byId(id);
        if (!skip && subslideIdx < curSlide.subslideCount) {
            return [id, subslideIdx + 1];
        } else if (curSlide.idx < this.slides.length - 1) {
            let nextSlide = this.slides.byIdx(curSlide.idx + 1);
            return [nextSlide.id, 0];
        }
        return ["", 0];
    }
    prevMedia(id: string): string {
        let curMedia = this.media.byId(id);
        if (curMedia.idx == 0) return "";
        let prevMedia = this.media.byIdx(curMedia.idx - 1);
        return prevMedia.id;
    }
    nextMedia(id: string): string {
        let curMedia = this.media.byId(id);
        if (curMedia.idx == this.media.length - 1) return "";
        let nextMedia = this.media.byIdx(curMedia.idx + 1);
        return nextMedia.id;
    }

    toJson(space: number | string) {
        this.modified = false;

        let items: Array<Record<string, any>> = [
            ...this.slides,
            ...this.media,
        ];
        for (let item of structuredClone(items)) {
            delete item['id'];
            delete item['idx'];
        };

        return JSON.stringify(items, undefined, space);
    }

    toText() {
        this.modified = false;

        let items: Array<Record<string, any>> = [
            ...this.slides,
            ...this.media,
        ];
        let text = "";

        for (let item of structuredClone(items)) {
            delete item['id'];
            delete item['idx'];

            let templateNum = TEMPLATES.findIndex(
                t => t[0] == item['type'] && t[1] == item['subtype']
            );

            let args = [ templateNum.toString() ];

            // Positional args
            for (let arg of TEMPLATES[templateNum][2]) {
                args.push(item[arg].replace("\n", "<br>"));
                delete item[arg];
            }

            // Keyword args
            for (let [key, val] of Object.entries(item)) {
                if (key == 'subslides') continue;
                args.push(`${key}=${val.replace("\n", "<br>")}`);
            }

            text += args.join(",") + "\n";

            // Subslides
            if (item['subslides']) {
                text += "S\n";
                text += item['subslides'].join("N\n");
                text += "\nE\n";
            }
        }

        return text;
    }

    static fromText(text: string, name?: string) {
        let playlist = new this();
        playlist.name = name || "";

        let reader = new TextReader(text);
        let curItem: Record<string, any> = {};
        let subslide = [];
        let readingSubslides = false;
        while (reader.canRead) {
            let line = reader.read();

            if (readingSubslides) {
                if (line == "E") {
                    curItem['subslides'].push(subslide.join("\n"));
                    readingSubslides = false;
                    subslide = [];
                } else {
                    if (line.endsWith("N")) {
                        subslide.push(line.trim().replace(/N$/,""));
                        curItem['subslides'].push(subslide.join("\n"));
                        subslide = [];
                    } else {
                        subslide.push(line.trim());
                    }
                }
            } else if (line == "S") {
                readingSubslides = true;
                curItem['subslides'] = [];
            } else {
                // Push last slide
                if (curItem['type']) {
                    playlist.push(PlaylistItem.fromRecord(curItem));
                    curItem = {};
                }

                // Reading slide line
                let readResult = line.match(/(\\.|[^,])+/g);
                if (!readResult)
                    throw new Error(`Error reading line ${reader.idx}`);
                let [template, ...args] = readResult;
                let templateNum = parseInt(template);

                if (!TEMPLATES[templateNum]) {
                    throw new Error(`Invalid slide type ${template}`);
                }

                let [type, subtype, positionalArgs] = TEMPLATES[templateNum];
                let positionalsMatched = 0;

                curItem['type'] = type;
                curItem['subtype'] = subtype;

                for (let arg of args) {
                    if (arg.includes("=")) {
                        let [key, val] = arg.split("=");
                        curItem[key] = val.replace("<br>", "\n");
                    } else {
                        let key = positionalArgs[positionalsMatched++];
                        curItem[key] = arg.replace("<br>", "\n");
                    }
                }

                if (!curItem['preview']) {
                    curItem['preview'] = positionalArgs
                        .slice(0, positionalsMatched)
                        .map(key => curItem[key])
                        .join(" - ");
                }
            }
        }

        if (readingSubslides) {
            throw new Error("Unexpected end of input");
        }

        // Push last slide
        if (curItem['type']) {
            playlist.push(PlaylistItem.fromRecord(curItem));
        }

        playlist.modified = false;
        return playlist;
    }

    static fromJson(json: string, name?: string) {
        let playlist = new this();
        playlist.name = name || "";
        let slides: Array<Record<string,any>> = Object.values(JSON.parse(json));
        for (let item of slides) {
            playlist.push(PlaylistItem.fromRecord(item));
        }
        playlist.modified = false;
        return playlist;
    }
}