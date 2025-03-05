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