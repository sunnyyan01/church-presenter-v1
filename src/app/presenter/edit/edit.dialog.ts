import { Component, computed, effect, input, output, signal } from '@angular/core';
import { Slide, SLIDE_CONSTRUCTORS } from '../../classes/playlist';
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
    slide = signal<Record<string, any>>({ template: "" });
    slideEntries = computed(() => Object.entries(this.slide()));
    close = output<EditDialogOutput | null>();

    constructor() {
        effect(() => {
            if (this.editIn().mode == "edit")
                this.slide.set(this.editIn().slide as any);
            else // "new"
                this.slide.set({ template: "", idx: this.editIn().idx });
        })
    }

    onChange(key: string, val: any) {
        if (key == "template") {
            if (val == "") return;
            let constructor = SLIDE_CONSTRUCTORS[val];
            let newSlide = new constructor({
                ...this.slide(),
                template: val,
            });
            this.slide.set(newSlide);
        } else {
            this.slide.update(s => ({ ...s, [key]: val }));
        }
    }

    onSave() {
        if (this.slide()["template"] == "") {
            alert("You must select a slide type!")
            return;
        }
        this.close.emit(this.editIn().toOutput(this.slide()));
    }
    onClose() {
        this.close.emit(null);
    }
}
