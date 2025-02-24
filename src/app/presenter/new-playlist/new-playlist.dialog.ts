import { Component, ElementRef, HostListener, input, output, ViewChild } from "@angular/core";
import { bibleLookup } from "../../api/bible";
import { nextSunday } from "../../classes/utils";

@Component({
    selector: 'new-playlist-dialog',
    templateUrl: './new-playlist.dialog.html',
    styleUrl: './new-playlist.dialog.css',
})
export class NewPlaylistDialog {
    @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;
    submit = output<string>();

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
    async autoBible(e: KeyboardEvent) {
        e.preventDefault();
        
        let {value, selectionStart, selectionEnd} = this.textarea.nativeElement;
        let [lineStart, lineEnd] = this.extendSelection(value, selectionStart, selectionEnd, "\n");
        let line = value.slice(lineStart, lineEnd);
        let match = /1,[^,]+,([^,]+)/.exec(line);
        let match2 = /version=(.+)(,|$)/.exec(line);
        if (match) {
            let text = await bibleLookup(match[1], match2 ? match2[1] : "");
            let toReplace = line + "\n" + text.trim() + "E";
            this.textarea.nativeElement.setRangeText(toReplace, lineStart, lineEnd);
            let newEnd = lineStart + toReplace.length;
            this.textarea.nativeElement.setSelectionRange(newEnd, newEnd);
        }
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

    onSubmit() {
        this.submit.emit(this.textarea.nativeElement.value);
    }
    onCancel() {
        this.submit.emit("");
    }
}