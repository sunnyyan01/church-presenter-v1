import { Component, ElementRef, HostListener, effect, input, output, signal, ViewChild } from "@angular/core";
import { bibleLookup } from "@app/api/bible";
import { nextSunday, TextReader } from "@app/classes/utils";
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

    @HostListener("keydown.control.b", ["$event"])
    async autoBibleIndividual(e: KeyboardEvent) {
        e.preventDefault();
        
        let {value, selectionStart, selectionEnd} = this.textarea.nativeElement;
        let [lineStart, lineEnd] = this.extendSelection(value, selectionStart, selectionEnd, "\n");
        let line = value.slice(lineStart, lineEnd);
        let match = /^1,[^,]*,([^,]+)/.exec(line);
        let match2 = /version=(.+)(,|$)/.exec(line);

        if (!match) {
            this.localErrorMessage.set("Slide type is not 1 (bible)");
            return;
        };
        if (match[1].match(/，|：/)) {
            this.localErrorMessage.set("Chinese punctuation detected");
            return;
        }
        
        try {
            let text = await bibleLookup(match[1], match2 ? match2[1] : "")
            let toReplace = line + "\nS\n  " + text.trim().replaceAll("\n", "\n  ") + "\nE";
            this.textarea.nativeElement.setRangeText(toReplace, lineStart, lineEnd);
            let newEnd = lineStart + toReplace.length;
            this.textarea.nativeElement.setSelectionRange(newEnd, newEnd);
        } catch (e: any) {
            this.localErrorMessage.set(e.message);
        }
    }

    async autoBible() {
        let input = this.textarea.nativeElement.value;
        let reader = new TextReader(input);
        while (reader.canRead) {
            let line = reader.read();
            if (reader.peek() == "S") continue;
            let match = /^1,[^,]+,([^,]+)/.exec(line);
            let match2 = /version=(.+?)(,|$)/.exec(line);
            if (match) {
                let text = await bibleLookup(match[1], match2 ? match2[1] : "");
                reader.write("S");
                reader.write(
                    ...text.trim().split("\n").map(line => "  " + line)
                );
                reader.write("E");
            }
        }
        this.textarea.nativeElement.value = reader.toString();
    }

    @HostListener("keydown.control.`", ["$event"])
    @HostListener("keydown.control.1", ["$event"])
    @HostListener("keydown.control.2", ["$event"])
    @HostListener("keydown.control.3", ["$event"])
    @HostListener("keydown.control.4", ["$event"])
    @HostListener("keydown.control.5", ["$event"])
    autoType(e: KeyboardEvent) {
        e.preventDefault();
        
        let template = e.key == '`' ? '0' : e.key;
        
        let {value, selectionStart, selectionEnd} = this.textarea.nativeElement;
        let [lineStart, lineEnd] = this.extendSelection(value, selectionStart, selectionEnd, "\n");
        let line = value.slice(lineStart, lineEnd);
        
        if (template == '0' && !line) {
            let [year, month, day] = nextSunday();
            line = `0,${year},${month},${day}`;
        } else {
            let match = /^[0-9],/.exec(line);
            if (match) {
                line = line.replace(/^[0-9],/, template + ",");
            } else {
                line = template + "," + line;
            }
        }

        if (template == '5') { // Youtube link handling
            let url = new URL(line.replace(/^5,/,""))
            if (url.pathname == "/watch") {
                line = "5," + url.searchParams.get("v");
            } else if (url.pathname.startsWith("/embed/")) {
                line = "5," + url.pathname.split("/")[2];
            } else if (url.hostname == "youtu.be") {
                line = "5," + url.pathname.slice(1);
            }
        }

        this.textarea.nativeElement.setRangeText(line, lineStart, lineEnd);
        let newEnd = lineStart + line.length;
        this.textarea.nativeElement.setSelectionRange(newEnd, newEnd);
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