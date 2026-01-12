import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})
export class FilePickerService {
    private bc = new BroadcastChannel("file-picker");

    openFilePicker = (folder: string, action: "open" | "save", defaultName?: string) => (
        new Promise((resolve) => {
            this.bc.postMessage({folder, action, defaultName});
            this.bc.addEventListener("message", e => {
                resolve(e.data.file);
            }, {once: true});
        })
    )
}