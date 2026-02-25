export class TextReader {
    lines: Array<string>;
    idx: number;
    canRead: Boolean;
    lastRead: string | null;
    newline: string;

    constructor(text: string) {
        this.newline = text.includes("\r") ? "\r\n" : "\n";
        this.lines = text.trim().split(this.newline);
        this.idx = -1;
        this.canRead = this.lines.length > 0;
        this.lastRead = null;
    }

    peek() {
        if (!this.canRead) return "";
        return this.lines[this.idx + 1];
    }

    read() {
        if (!this.canRead) return "";
        this.lastRead = this.lines[++this.idx];
        if (this.idx + 1 >= this.lines.length)
            this.canRead = false;
        return this.lastRead;
    }

    write(...toInsert: string[]) {
        this.lines.splice(this.idx + 1, 0, ...toInsert);
        this.idx += toInsert.length;
    }
    writeOver(toInsert: string) {
        this.lines[this.idx] = toInsert;
    }

    toString(): string {
        return this.lines.join(this.newline);
    }
}

export class FormatString {
    tokens;

    constructor(string: String) {
        this.tokens = string.match(/{}|[^{}]+/g) || [];
    }

    format(...params: Array<String>) {
        let i = 0;
        let str = "";
        for (let token of this.tokens) {
            if (token === "{}") {
                str += params[i++];
            } else {
                str += token;
            }
        }
        return str;
    }
}

export function nextSunday() {
    let date = new Date();
    let sunOffset = (7 - date.getDay()) % 7;
    let dayOfMonth = date.getDate();
    date.setDate(dayOfMonth + sunOffset);
    return [
        date.getFullYear().toString(),
        (date.getMonth()+1).toString(),
        date.getDate().toString()
    ];
}

export function iso8601date(year: string, month: string, day: string) {
    return year.padStart(4, "0") + month.padStart(2, "0") + day.padStart(2, "0");
}

export function timeConvert(sec: number) {
    return (
        Math.trunc(sec / 60) +
        ":" +
        Math.trunc(sec % 60).toString().padStart(2, "0")
    );
}

export interface ObjectWithId {
    id: string;
    idx: number;
}

export class OrderedDict<T extends ObjectWithId> {
    nextId = 0;
    dict: Record<string, T> = {};
    order: Array<string> = [];

    [Symbol.iterator]() {
        let x = this.order.map(id => this.dict[id])
        return x.values();
    }

    byId(id: string) {
        return this.dict[id];
    }
    byIdx(idx: number) {
        return this.dict[this.order[idx]];
    }

    push(item: T) {
        let curId = this.nextId++;
        item.id = curId.toString();
        if (!item.idx) item.idx = this.order.length;
        this.dict[curId] = item;
        if (item.idx) {
            this.order.splice(item.idx, 0, item.id);
        } else {
            this.order.push(item.id);
        }
    }

    replace(item: T) {
        this.dict[item.id] = item;
    }

    move(id: string, direction: 1 | -1) {
        let item = this.byId(id);
        let curIdx = item.idx;
        if (direction == -1 && curIdx == 0) return;
        if (direction == 1 && curIdx == this.order.length - 1) return;
        let newIdx = curIdx + direction;

        let temp = this.order[curIdx];
        this.order[curIdx] = this.order[newIdx];
        this.order[newIdx] = temp;

        this.byIdx(curIdx).idx = curIdx;
        this.byIdx(newIdx).idx = newIdx;
    }

    delete(id: string) {
        let idx = this.byId(id).idx;
        delete this.dict[id];
        this.order.splice(idx, 1);
        for (let i = 0; i < this.order.length; i++) {
            let id = this.order[i];
            this.dict[id].idx = i;
        }
    }

    get length() {
        return this.order.length;
    }
}

const BOOKS = ["创世记","创","Genesis","Gen","出埃及记","出","Exodus","Exo","利未记","利","Leviticus","Lev","民数记","民","Numbers","Num","申命记","申","Deuteronomy","Deu","约书亚记","书","Joshua","Jos","士师记","士","Judges","Jug","路得记","得","Ruth","Rut","撒母耳记上","撒上","1 Samuel","1Sa","撒母耳记下","撒下","2 Samuel","2Sa","列王纪上","王上","1Kings","1Ki","列王纪下","王下","2Kings","2Ki","历代志上","代上","1 Chronicles","1Ch","历代志下","代下","2 Chronicles","2Ch","以斯拉记","拉","Ezra","Ezr","尼希米记","尼","Nehemiah","Neh","以斯帖记","斯","Esther","Est","约伯记","伯","Job","Job","诗篇","诗","Psalms","Psm","箴言","箴","Proverbs","Pro","传道书","传","Ecclesiastes","Ecc","雅歌","歌","Song of Songs","Son","以赛亚书","赛","Isaiah","Isa","耶利米书","耶","Jeremiah","Jer","耶利米哀歌","哀","Lamentations","Lam","以西结书","结","Ezekiel","Eze","但以理书","但","Daniel","Dan","何西阿书","何","Hosea","Hos","约珥书","珥","Joel","Joe","阿摩司书","摩","Amos","Amo","俄巴底亚书","俄","Obadiah","Oba","约拿书","拿","Jonah","Jon","弥迦书","弥","Micah","Mic","那鸿书","鸿","Nahum","Nah","哈巴谷书","哈","Habakkuk","Hab","西番雅书","番","Zephaniah","Zep","哈该书","该","Haggai","Hag","撒迦利亚书","亚","Zechariah","Zec","玛拉基书","玛","Malachi","Mal","马太福音","太","Matthew","Mat","马可福音","可","Mark","Mak","路加福音","路","Luke","Luk","约翰福音","约","John","Jhn","使徒行传","徒","Acts","Act","罗马书","罗","Romans","Rom","哥林多前书","林前","1 Corinthians","1Co","哥林多后书","林后","2 Corinthians","2Co","加拉太书","加","Galatians","Gal","以弗所书","弗","Ephesians","Eph","腓利比书","腓","Philippians","Phl","歌罗西书","西","Colossians","Col","帖撒罗尼迦前书","帖前","1 Thessalonians","1Ts","帖撒罗尼迦后书","帖后","2 Thessalonians","2Ts","提摩太前书","提前","1 Timothy","1Ti","提摩太后书","提后","2 Timothy","2Ti","提多书","多","Titus","Tit","腓利门书","门","Philemon","Phm","希伯来书","来","Hebrews","Heb","雅各书","雅","James","Jas","彼得前书","彼前","1 Peter","1Pe","彼得后书","彼后","2 Peter","2Pe","约翰壹书","约一","1 John","1Jn","约翰贰书","约二","2 John","2Jn","约翰参书","约三","3 John","3Jn","犹大书","犹","Jude","Jud","启示录","启","Revelation","Rev"];
export function translateBibleLoc(chineseLoc: string, inline: boolean) {
    let match = chineseLoc.match(/^([^0-9:\- ]+) *(\d+(:\d+(-\d+)?)?)$/)!;
    if (!match) return chineseLoc;
    let [_, book, rest] = match;

    let translatedBook = "";
    let idx = BOOKS.findIndex(b => b == book);
    if (idx == -1) {
        return inline ? chineseLoc : "";
    } else if (idx % 4 <= 1) { // Chinese to English
        translatedBook = BOOKS[idx - (idx % 4) + 2];
    } else { // English to Chinese
        translatedBook = BOOKS[idx - (idx % 4)];
    }

    return inline ? `${book}${translatedBook} ${rest}` : `${translatedBook} ${rest}`;
}