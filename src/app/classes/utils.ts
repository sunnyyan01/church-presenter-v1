export class TextReader {
    lines: Array<String>;
    idx: number;
    canRead: Boolean;
    lastRead: String | null;

    constructor(text: String) {
        let newline = text.includes("\r") ? "\r\n" : "\n";
        this.lines = text.trim().split(newline);
        this.idx = -1;
        this.canRead = this.lines.length > 0;
        this.lastRead = null;
    }

    peek() {
        if (!this.canRead)
            throw Error(`Cannot read past end of file`);
        return this.lines[this.idx + 1];
    }

    read() {
        if (!this.canRead)
            throw Error(`Cannot read past end of file`);
        this.lastRead = this.lines[++this.idx];
        if (this.idx + 1 >= this.lines.length)
            this.canRead = false;
        return this.lastRead;
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