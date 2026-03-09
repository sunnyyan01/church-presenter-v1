import { Component, computed, effect, signal } from "@angular/core";
import { BlobServiceClient } from "@azure/storage-blob";

const FOLDER_NAMES: Record<string, string> = {
    "user-files": "User Files",
    "playlists": "Playlists",
    "slide-library": "Slide Library",
    "media-library": "Media Library",
}

@Component({
    selector: "file-picker",
    styleUrl: "./file-picker.dialog.css",
    templateUrl: "./file-picker.dialog.html",
})
export class FilePicker {
    bc: BroadcastChannel;

    open = signal<boolean>(false);
    folder = signal<string>("");
    friendlyFolderName = computed(() => FOLDER_NAMES[this.folder()] || this.folder());
    action = signal<"open" | "save">("open");
    files = signal<Array<string>>([]);
    selected = signal<string>("");

    sasUrl = signal<string>(localStorage.getItem("sas_url") || "");
    sasColour = signal<string>("red");

    constructor() {
        this.bc = new BroadcastChannel("file-picker");
        this.bc.addEventListener("message", e => {
            let {folder, action, defaultName} = e.data;
            this.folder.set(folder);
            this.action.set(action);
            this.selected.set(defaultName || "");
            this.open.set(true);
        })

        effect(this.refresh.bind(this));

        effect(() => {
            if (this.sasUrl()) {
                let expiry = new Date(new URL(this.sasUrl()).searchParams.get("se") as string).getTime();
                let now = Date.now();
                let toExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
                this.sasColour.set(toExpiry < 14 ? "yellow" : "lime");
            } else {
                this.sasColour.set(this.action() == "open" ? "transparent" : "red");
            }
        })
    }

    async refresh() {
        if (!this.folder()) return;

        let files = [];
        let serviceClient = new BlobServiceClient("https://churchpresenterpublic.blob.core.windows.net");
        let containerClient = serviceClient.getContainerClient(this.folder());
        for await (let blob of containerClient.listBlobsFlat()) {
            files.push(blob.name);
        }
        this.files.set(files);
    }

    changeSas() {
        this.sasUrl.set(window.prompt("Enter the SAS URL:") || "");
        localStorage.setItem("sas_url", this.sasUrl());
    }

    onClose() {
        if (!this.selected()) {
            alert(
                this.action() == "open"
                ? "Please select a file"
                : "Please enter a file name"
            );
            return;
        }
        if (this.action() == "open" && !this.files().includes(this.selected())) {
            alert(`Unknown file ${this.selected()}`)
            return;
        }
        if (this.action() == "save" && !this.sasUrl()) {
            alert("Can't save without a SAS URL");
            return;
        }

        this.bc.postMessage({file: this.selected()});
        this.open.set(false);
    }

    onCancel() {
        this.open.set(false);
    }
}