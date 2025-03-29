import { Component, computed, effect, HostListener, input, output, signal } from '@angular/core';
import { CONSTRUCTORS } from '../../classes/playlist';
import { EditField } from './edit-field.component';
import { EditDialogInput, EditDialogOutput } from '../../classes/edit';

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
