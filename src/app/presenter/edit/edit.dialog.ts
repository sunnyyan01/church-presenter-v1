import { Component, computed, effect, ElementRef, HostListener, inject, input, output, signal, ViewChild } from '@angular/core';
import { BlobServiceClient } from '@azure/storage-blob';
import { ContentSlide, CONSTRUCTORS } from '@app/classes/playlist';
import { EditDialogInput, EditDialogOutput } from '@app/classes/edit';
import { nextSunday, translateBibleLoc } from '@app/classes/utils';
import { bibleLookup } from '@app/api/bible';
import { ToastsService } from '@services/toasts.service';
import { FilePickerService } from '@services/file-picker.service';
import { EditField } from './edit-field.component';

@Component({
    selector: 'edit-dialog',
    imports: [EditField],
    templateUrl: './edit.dialog.html',
    styleUrl: './edit.dialog.css'
})
export class EditDialog {
    editIn = input.required<EditDialogInput>();
    slide = signal<Record<string, any>>({});
    slideEntries = computed(() => Object.entries(this.slide()));
    close = output<EditDialogOutput | null>();

    loading = signal<boolean>(false);
    
    @ViewChild("autoBibleMenu") autoBibleMenu!: ElementRef<HTMLDivElement>;
    autoBibleMenuOpen = signal<boolean>(false);
    autoBibleVersion = signal<string>("");

    fp = inject(FilePickerService);
    toasts = inject(ToastsService);

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

    @HostListener('document:click', ['$event'])
    onClickOut(e: MouseEvent) {
        if (this.autoBibleMenuOpen() && this.autoBibleMenu) {
            if (!this.autoBibleMenu.nativeElement.contains(e.target as Node | null)) {
                this.autoBibleMenuOpen.set(false);
            }
        }
    }

    async loadFromLibrary() {
        let type = this.editIn().type;

        let name = await this.fp.openFilePicker(type + "-library", "open");
        if (!name) return;
        let resp = await fetch(
            `https://churchpresenterpublic.blob.core.windows.net/${type}-library/${name}`
        );
        let slide = await resp.json();

        this.slide.update(old => ({ ...old, ...slide }));
    }
    async saveToLibrary() {
        let type = this.editIn().type;
        let slide = { ...this.slide() };
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
            { blobHTTPHeaders: { blobContentType: "application/json" } }
        );

        this.toasts.createToast("success", "Saved successfully");
    }

    openAutoBibleMenu() {
        this.autoBibleMenuOpen.set(true);
    }
    changeAutoBibleVersion(e: Event) {
        let target = e.target as HTMLInputElement;
        this.autoBibleVersion.set(target.value);
    }

    async autoBible() {
        this.loading.set(true);
        let bibleSlide = this.slide() as ContentSlide;
        let loc = bibleSlide.subtitle;
        let doTranslation = !!bibleSlide.subtitle_tr;
        let version = this.autoBibleVersion();
        try {
            let text = await bibleLookup(loc, version);
            if (text.length == 1) {
                this.onChange("subslides", [text[0].text]);
            } else {
                this.onChange("subslides", text.map(x => (
                    doTranslation
                    ? translateBibleLoc(x.loc, true) + "\n" + x.text
                    : x.loc + "\n" + x.text
                )));
            }
        } catch (e: any) {
            this.toasts.createToast("error", e.message);
            throw e;
        }
        this.loading.set(false);
    }

    async autoDate() {
        let [year, month, day] = nextSunday();
        this.onChange("year", year);
        this.onChange("month", month);
        this.onChange("day", day);
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
