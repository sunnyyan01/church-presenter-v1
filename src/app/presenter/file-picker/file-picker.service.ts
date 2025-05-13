import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root',
})
export class FilePickerService {
    private bc = new BroadcastChannel("file-picker");

    openFilePicker = (folder: string, action: "open" | "save") => (
        new Promise((resolve) => {
            this.bc.postMessage({folder, action});
            this.bc.addEventListener("message", e => {
                resolve(e.data.file);
            }, {once: true});
        })
    )
}