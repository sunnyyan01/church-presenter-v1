import { Component, computed, effect, HostListener, inject, input, output, signal } from '@angular/core';
import { CONSTRUCTORS } from '../../classes/playlist';
import { EditField } from './edit-field.component';
import { EditDialogInput, EditDialogOutput } from '../../classes/edit';
import { FilePickerService } from '../file-picker/file-picker.service';
import { BlobServiceClient } from '@azure/storage-blob';

@Component({
    selector: 'edit-dialog',
    imports: [EditField],
    templateUrl: './edit.dialog.html',
    styleUrl: './edit.dialog.css'
})
export class EditDialog {
    editIn = input.required<EditDialogInput>();
    slide = signal<Record<string, any>>({ });
    slideEntries = computed(() => Object.entries(this.slide()));
    close = output<EditDialogOutput | null>();

    fp = inject(FilePickerService);

    constructor() {
        effect(() => {
            if (this.editIn().mode == "edit") {
                this.slide.set(this.editIn().playlistItem as any);
            } else { // "new"
                this.slide.set({
                    type: this.editIn().type,
                    subtype: "",
                    idx: this.editIn().idx
                });
            }
        })
    }

    async loadFromLibrary() {
        let type = this.editIn().type;

        let name = await this.fp.openFilePicker(type + "-library", "open");
        if (!name) return;
        let resp = await fetch(
            `https://churchpresenterpublic.blob.core.windows.net/${type}-library/${name}`
        );
        let slide = await resp.json();

        this.slide.update(old => ({...old, ...slide}));
    }
    async saveToLibrary() {
        let type = this.editIn().type;
        let slide = {...this.slide()};
        delete slide["id"];
        delete slide["idx"];
        let slideJson = JSON.stringify(slide);

        let name = await this.fp.openFilePicker(type + "-library", "save") as string;
        if (!name) return;
        
        let serviceClient = new BlobServiceClient(localStorage.getItem("sas_url") as string);
        let containerClient = serviceClient.getContainerClient(type + "-library");
        let blobClient = containerClient.getBlockBlobClient(name);
        await blobClient.uploadData(
            new Blob([slideJson!]),
            {blobHTTPHeaders: {blobContentType: "application/json"}}
        );

        alert("Saved successfully");
    }

    onChange(key: string, val: any) {
        if (key == "subtype") {
            if (val == "") return;
            let constructor = CONSTRUCTORS[this.slide()['type'] + val];
            let newSlide = new constructor({
                ...this.slide(),
                subtype: val,
            });
            this.slide.set(newSlide);
        } else {
            this.slide.update(s => ({ ...s, [key]: val }));
        }
    }

    onSave() {
        if (this.slide()["subtype"] == "") {
            alert("You must select a subtype!")
            return;
        }
        this.close.emit({
            mode: this.editIn().mode,
            slide: this.slide(),
        });
    }
    onClose() {
        this.close.emit(null);
    }

    @HostListener("keydown", ["$event"])
    stopBubbling(e: KeyboardEvent) {
        e.stopPropagation();
    }
}
