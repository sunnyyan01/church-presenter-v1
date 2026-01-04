import { Component, computed, effect, input, output, signal } from "@angular/core";
import { BlobServiceClient } from "@azure/storage-blob";

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
            let files = [];
            let serviceClient = new BlobServiceClient("https://churchpresenterpublic.blob.core.windows.net");
            let containerClient = serviceClient.getContainerClient(this.folder());
            for await (let blob of containerClient.listBlobsFlat()) {
                files.push(blob.name);
            }
            this.files.set(files);
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

        this.close.emit(this.selected());
    }
}