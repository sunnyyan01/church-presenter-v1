import { Component, ElementRef, HostListener, effect, input, output, signal, ViewChild } from "@angular/core";
import { bibleLookup } from "@app/api/bible";
import { TEMPLATES } from "@app/classes/playlist";
import { nextSunday, translateBibleLoc } from "@app/classes/utils";
import { ToastComponent } from "@presenter/toasts/toast.component";

@Component({
    selector: 'new-playlist-dialog',
    templateUrl: './new-playlist.dialog.html',
    styleUrl: './new-playlist.dialog.css',
    imports: [ToastComponent],
})
export class NewPlaylistDialog {
    @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;
    errorMessage = input<string>("");
    localErrorMessage = signal("");
    submit = output<string>();

    constructor() {
        effect(() => {
            this.localErrorMessage.set(this.errorMessage());
        })
    }

    extendSelection(text: string, start: number, end: number, to: string | RegExp) {
        while (start > 0 && !text[start - 1].match(to)) {
            start--;
        }
        while (end <= text.length && !text.slice(end, end+1).match(to)) {
            end++;
        }
        return [start, end];
    }

    @HostListener("keydown.control.b")
    async autoBible() {
        let {value, selectionStart, selectionEnd} = this.textarea.nativeElement;
        let [lineStart, lineEnd] = this.extendSelection(value, selectionStart, selectionEnd, "\n");
        let line = value.slice(lineStart, lineEnd);
        
        let match = /^1,[^,]*,([^,]+)/.exec(line);
        let match2 = /version=(.+)(,|$)/.exec(line);
        let doTranslation = line.match(/,translate(,|$)/);

        if (!match) {
            this.localErrorMessage.set("Slide type is not 1 (bible)");
            return;
        };
        if (match[1].match(/，|：/)) {
            this.localErrorMessage.set("Chinese punctuation detected");
            return;
        }
        
        try {
            let results = await bibleLookup(match[1], match2 ? match2[1] : "CUVMPS")
            let toReplace = line + "\nS\n  ";
            if (results.length == 1) {
                toReplace += results[0].text;
            } else {
                toReplace += results.map(result => (
                    (doTranslation ? translateBibleLoc(result.loc, true) : result.loc)
                    + "\n" + result.text
                )).join("N\n");
            }
            toReplace += "\nE";
            this.textarea.nativeElement.setRangeText(toReplace, lineStart, lineEnd);
            let newEnd = lineStart + toReplace.length;
            this.textarea.nativeElement.setSelectionRange(newEnd, newEnd);
        } catch (e: any) {
            this.localErrorMessage.set(e.message);
            return;
        }
    }

    @HostListener("keydown.control.`", ["0", "true"])
    @HostListener("keydown.control.1", ["1", "true"])
    @HostListener("keydown.control.2", ["2", "true"])
    @HostListener("keydown.control.3", ["3", "true"])
    @HostListener("keydown.control.4", ["4", "true"])
    @HostListener("keydown.control.5", ["5", "true"])
    async autoType(type: number, fromKeyboard?: boolean) {        
        let {value, selectionStart, selectionEnd} = this.textarea.nativeElement;
        let [lineStart, lineEnd] = this.extendSelection(value, selectionStart, selectionEnd, "\n");
        let line = value.slice(lineStart, lineEnd);
        
        if (line) {
            // Simple change of slide type
            if (line.match(/^[0-9],/)) {
                line = line.replace(/^[0-9],/, `${type},`);
            } else {
                let parts = line.split(/[ :，：]+/, TEMPLATES[type][2].length);
                parts.unshift(type.toString());
                line = parts.join(",");
            }
        } else {
            line = `${type},`;
        }

        if (line == "0,") {
            let [year, month, day] = nextSunday();
            line = `0,${year},${month},${day}`;
        } else if (type == 5) {
            try {
                let url = new URL(line.replace(/^5,/,""))
                if (url.pathname == "/watch") {
                    line = "5," + url.searchParams.get("v");
                } else if (url.pathname.startsWith("/embed/")) {
                    line = "5," + url.pathname.split("/")[2];
                } else if (url.hostname == "youtu.be") {
                    line = "5," + url.pathname.slice(1);
                }
            } catch {}
        }

        this.textarea.nativeElement.setRangeText(line, lineStart, lineEnd);
        let newEnd = lineStart + line.length;
        this.textarea.nativeElement.setSelectionRange(newEnd, newEnd);

        if (!fromKeyboard) {
            this.textarea.nativeElement.focus();
        }
    }

    @HostListener("keydown.control.,", ["$event"])
    autoComma(e: KeyboardEvent) {
        e.preventDefault();

        let {value, selectionStart, selectionEnd} = this.textarea.nativeElement;
        let [newStart, newEnd] = this.extendSelection(value, selectionStart, selectionEnd, /[A-Za-z0-9\u4E00-\u9FFF]/u);
        this.textarea.nativeElement.setRangeText(",", newStart, newEnd);
        this.textarea.nativeElement.setSelectionRange(newStart + 1, newStart + 1);
    }

    @HostListener("keydown", ["$event"])
    stopBubbling(e: KeyboardEvent) {
        e.stopPropagation();
    }

    onTextChange() {
        this.localErrorMessage.set("");
    }

    onSubmit() {
        this.submit.emit(this.textarea.nativeElement.value);
    }
    onCancel() {
        this.submit.emit("");
    }
}