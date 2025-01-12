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