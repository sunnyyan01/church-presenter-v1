import { Component, computed, effect, input, output, signal } from "@angular/core";

const FOLDER_NAMES: Record<string, string> =  {
    "user-files": "User Files",
}

@Component({
    selector: "file-picker",
    styleUrl: "./file-picker.dialog.css",
    templateUrl: "./file-picker.dialog.html",
})
export class FilePicker {
    folder = input.required<string>();
    friendlyFolderName = computed(() => FOLDER_NAMES[this.folder()])
    action = input.required<"open" | "save">();
    files = signal<Array<string>>([]);
    selected = signal<string>("");
    close = output<string>();

    constructor() {
        effect(() => {
            fetch(`/api/files/${this.folder()}`)
                .then(res => res.json())
                .then(res => this.files.set(res));
        })
    }

    onClose() {
        if (this.action() == "open" && !this.selected()) {
            alert("Please select a file");
            return;
        } if (this.action() == "open" && !this.files().includes(this.selected())) {
            alert(`Unknown file ${this.selected()}`)
            return;
        }

        this.close.emit(this.selected());
    }
}