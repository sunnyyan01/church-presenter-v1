import { Component, computed, effect, input, output, signal } from "@angular/core";
import { BibleSlide, Slide, TEMPLATES } from "../../classes/playlist";

const FRIENDLY_NAMES: Record<string, string> = {
    location: "Location",
    preview: "Preview",
    subslides: "Subslides",
    subtitle: "Subtitle",
    subtitles: "Subtitles",
    template: "Template",
    title: "Title",
    name: "Name",
    version: "Version",
    year: "Year",
    month: "Month",
    day: "Day",
}
const HIDDEN_FIELDS: Array<string> = ['id', 'idx', 'hasPlayback', ]
const AUTO_FIELDS: Array<string> = [
    'start',
    'end',
    'preview',
    // 'subslides',
]

@Component({
    selector: '[edit-field]',
    templateUrl: './edit-field.component.html',
    styleUrl: './edit-field.component.css',
})
export class EditField {
    slide = input.required<Record<string, any>>();

    field = input.required<[string, any]>();
    key = computed(() => this.field()[0]);
    friendlyKey = computed(() => FRIENDLY_NAMES[this.key()]);
    val = signal<any>(null);
    isHidden = computed(() => HIDDEN_FIELDS.includes(this.field()[0]));
    autoAvail = computed(() => (
        (this.slide()['template'] == 'bible' && this.field()[0] == 'subslides') ||
        AUTO_FIELDS.includes(this.field()[0])
    ));
    loading = signal<boolean>(false);

    valChange = output<any>();

    constructor() {
        effect(() => {
            this.val.set(this.field()[1]);
        })
    }

    onChange(e: Event) {
        let val = (e.target as HTMLInputElement).value;
        if (this.key() == 'subslides') {
            let subslides = val.split(/N\n?/);
            this.valChange.emit(subslides);
        } else {
            this.valChange.emit(val);
        }
    }

    autoPreview() {
        let template = TEMPLATES.find(t => t[0] == this.slide()['template']) as [string, string[]];
        let tFields = template[1];
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
            sessionStorage.getItem("serverlessMode") === "true"
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

    auto() {
        switch(this.key()) {
            case "preview":
                this.autoPreview();
                break;
            case "subslides":
                this.autoSubslides();
                break;
        }
    }
}