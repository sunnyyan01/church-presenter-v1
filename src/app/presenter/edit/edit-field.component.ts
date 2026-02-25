import { Component, computed, effect, inject, input, output, signal } from "@angular/core";
import { CONSTRUCTORS } from "@app/classes/playlist";
import { translateBibleLoc } from "@app/classes/utils";
import { FilePickerService } from "@app/services/file-picker.service";

const FRIENDLY_NAMES: Record<string, string> = {
    location: "Location",
    preview: "Preview",
    subslides: "Subslides",
    subtitle: "Subtitle",
    subtitles: "Subtitles",
    subtype: "Subtype",
    title: "Title",
    title_tr: "Translated Title",
    name: "Name",
    version: "Version",
    year: "Year",
    month: "Month",
    day: "Day",
    videoId: "Video ID",
    start: "Start",
    end: "End",
    imageSrc: "Image URL",
    videoSrc: "Video URL",
    subtitleSrc: "Subtitle URL",
}
const HIDDEN_FIELDS: Array<string> = ['id', 'idx', 'type', ]
const AUTO_FIELDS: Record<string, string> = {
    start: 'Format',
    end: 'Format',
    preview: 'Auto',
    imageSrc: 'Open',
    videoSrc: 'Open',
    subtitleSrc: 'Open',
    title_tr: 'Auto',
    location_tr: 'Auto',
}
const TITLE_TRANSLATIONS: Array<[RegExp, string]> = [
    [/宣召(经文)?/, "Call to Worship"],
    [/奉献(经文)?/, "Offering Verse"],
    [/祝福([/与和]差遣)?/, "Benediction"],
    [/欢迎[/与和]报告/, "Welcome & Announcements"],
    [/回应诗歌/, "Response Song"],
    [/差遣诗歌/, "Final Song"],
    [/诗歌/, "Song"],
    [/(主日)?奉献/, "Offering"],
    [/(祈祷)|(祷告)/, "Prayer"],
    [/证道/, "Message"],
]

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
    friendlyKey = computed(() => {
        if (this.key().endsWith("_tr")) {
            return "Translated " + FRIENDLY_NAMES[this.key().replace(/_tr$/, "")];
        }
        return FRIENDLY_NAMES[this.key()];
    });
    val = signal<any>(null);
    isHidden = computed(() => HIDDEN_FIELDS.includes(this.field()[0]));
    autoLabel = computed(() => AUTO_FIELDS[this.field()[0]]);
    loading = signal<boolean>(false);

    valChange = output<any>();

    constructor() {
        effect(() => {
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
        let slide = new CONSTRUCTORS[this.slide()['type'] + this.slide()['subtype']](this.slide());
        this.valChange.emit(slide.resetPreview());
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
        this.valChange.emit("https://churchpresenterpublic.blob.core.windows.net/user-files/" + file);
    }

    autoTranslate() {
        let {subtype} = this.slide();
        let originalKey = this.key().replace(/_tr$/, "");
        let original = this.slide()[originalKey];

        if (originalKey == "location") {
            this.valChange.emit(
                original.split(";").map((l: string) => translateBibleLoc(l, false)).join(";")
            );
            return;
        }

        for (let [regex, translated] of TITLE_TRANSLATIONS) {
            if (original.match(regex)) {
                this.valChange.emit(translated);
                return;
            }
        }

        if (subtype == "bible") {
            this.valChange.emit("Bible Reading");
        }
    }

    auto() {
        switch(this.key()) {
            case "preview":
                this.autoPreview();
                break;
            case "start":
            case "end":
                this.autoTimeConvert();
                break;
            case "imageSrc":
            case "subtitleSrc":
            case "videoSrc":
                this.openFilePicker();
                break;
            case "title_tr":
            case "location_tr":
                this.autoTranslate();
                break;
        }
    }
}