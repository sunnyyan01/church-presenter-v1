import { Component, computed, effect, input, output, signal } from "@angular/core";

const FOLDER_NAMES: Record<string, string> = {
    "user-files": "User Files",
    "playlists": "Playlists",
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

    sasUrl = signal<string>(localStorage.getItem("sas_url") || "");
    sasStatus = signal<string>("Not provided");
    sasColour = signal<string>("white");

    constructor() {
        effect(async () => {
            let resp = await fetch(`https://churchpresenterpublic.blob.core.windows.net/${this.folder()}?restype=container&comp=list`);
            let text = await resp.text();
            let parser = new DOMParser();
            let xml = parser.parseFromString(text, "application/xml");
            this.files.set(Array.from(xml.querySelectorAll("Name")).map(e => e.textContent as string));
        })

        effect(() => {
            if (this.sasUrl()) {
                let expiry = new Date(new URL(this.sasUrl()).searchParams.get("se") as string).getTime();
                let now = Date.now();
                let toExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
                this.sasStatus.set(`Provided, expires in ${toExpiry.toFixed(0)} days`);
                this.sasColour.set(toExpiry < 14 ? "white" : "yellow");
            } else {
                this.sasStatus.set("Not provided");
                this.sasColour.set(this.action() == "open" ? "white" : "red");

            }
        })
    }

    changeSas() {
        this.sasUrl.set(window.prompt("Enter the SAS URL:") || "");
        localStorage.setItem("sas_url", this.sasUrl());
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