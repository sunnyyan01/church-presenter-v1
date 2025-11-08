import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { BibleSlide, Slide, TEMPLATES } from "../../classes/playlist";
import { FilePickerService } from "../file-picker/file-picker.service";

const FRIENDLY_NAMES: Record<string, string> = {
    location: "Location",
    preview: "Preview",
    subslides: "Subslides",
    subtitle: "Subtitle",
    subtitles: "Subtitles",
    subtype: "Subtype",
    title: "Title",
    name: "Name",
    version: "Version",
    year: "Year",
    month: "Month",
    day: "Day",
    videoId: "Video ID",
    start: "Start",
    end: "End",
    videoSrc: "Video URL",
    subtitleSrc: "Subtitle URL",
}
const HIDDEN_FIELDS: Array<string> = ['id', 'idx', 'type', ]
const AUTO_FIELDS: Record<string, string> = {
    start: 'Format',
    end: 'Format',
    preview: 'Auto',
    videoSrc: 'Open',
    subtitleSrc: 'Open',
    subslides: 'Bible Lookup',
}

@Component({
    selector: '[edit-field]',
    templateUrl: './edit-field.component.html',
    styleUrl: './edit-field.component.css',
})
export class EditField {
    slide = input.required<Record<string, any>>();

    fp = inject(FilePickerService);

    field = input.required<[string, any]>();
    key = computed(() => this.field()[0]);
    friendlyKey = computed(() => FRIENDLY_NAMES[this.key()]);
    val = signal<any>(null);
    isHidden = computed(() => HIDDEN_FIELDS.includes(this.field()[0]));
    autoLabel = computed(() => AUTO_FIELDS[this.field()[0]]);
    loading = signal<boolean>(false);

    valChange = output<any>();

    constructor() {
        effect(() => {
            if (this.field()[0] == 'subtype')
                console.log(this.field()[1]);
            this.val.set(this.field()[1]);
        })
    }

    onChange(e: Event) {
        let target = e.target as HTMLElement;
        let val;
        switch (target.tagName) {
            case "INPUT":
            case "SELECT":
            case "TEXTAREA":
                val = (target as HTMLInputElement).value;
                break;
            default:
                val = target.textContent;
        }
        if (this.key() == 'subslides') {
            let subslides = val!.split(/N\n?/);
            this.valChange.emit(subslides);
        } else {
            this.valChange.emit(val);
        }
    }

    autoPreview() {
        let template = TEMPLATES.find(
            t => t[0] == this.slide()['type'] && t[1] == this.slide()['subtype']
        );
        let tFields = template![2];
        let preview = tFields
            .map(f => this.slide()[f])
            .filter(x => x)
            .join(' - ');
        this.valChange.emit(preview);
    }

    async autoSubslides() {
        this.loading.set(true);
        let bibleSlide = this.slide() as BibleSlide;
        let loc = bibleSlide.location;
        let version = bibleSlide.version;
        let url = (
            // sessionStorage.getItem("serverlessMode") === "true"
            true
            ? "https://churchpresenterapi.azurewebsites.net/api/bible-lookup"
            : "/api/bible-lookup"
        )
        let search = new URLSearchParams({loc, version});
        let resp = await fetch(url + "?" + search.toString());
        let text = await resp.text();
        if (resp.ok) {
            this.valChange.emit([text]);
        } else {
            alert("Error: " + text);
            throw new Error(text);
        }
    }

    autoTimeConvert() {
        let timeFields = this.val().split(":");
        if (timeFields.length === 3) {
            let [hour, min, sec] = timeFields;
            this.valChange.emit(hour * 3600 + min * 60 + parseFloat(sec));
        } else if (timeFields.length === 2) {
            let [min, sec] = timeFields;
            this.valChange.emit(min * 60 + parseFloat(sec));
        }
    }

    async openFilePicker() {
        let file = await this.fp.openFilePicker("user-files", "open");
        if (!file) return;
        this.valChange.emit("/api/files/user-files/" + file);
    }

    auto() {
        switch(this.key()) {
            case "preview":
                this.autoPreview();
                break;
            case "subslides":
                this.autoSubslides();
                break;
            case "start":
            case "end":
                this.autoTimeConvert();
                break;
            case "subtitleSrc":
            case "videoSrc":
                this.openFilePicker();
                break;
        }
    }
}