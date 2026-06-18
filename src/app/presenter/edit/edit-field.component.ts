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
    videoId: 'Format',
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
    selector: 'edit-field',
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
    invalid = signal<boolean>(false);

    valChange = output<any>();

    constructor() {
        effect(() => {
            this.val.set(this.field()[1]);
        })
        effect(() => {
            this.val();
            if (this.key() == "videoId") {
                this.invalid.set(this.val().length != 11);
            }
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
        return slide.resetPreview();
    }

    autoTimeConvert(): number | void {
        let timeFields = this.val().split(":");
        if (timeFields.length === 3) {
            let [hour, min, sec] = timeFields;
            return hour * 3600 + min * 60 + parseFloat(sec);
        } else if (timeFields.length === 2) {
            let [min, sec] = timeFields;
            return min * 60 + parseFloat(sec);
        }
    }

    async openFilePicker() {
        let file = await this.fp.openFilePicker("user-files", "open");
        if (!file) return;
        return "https://churchpresenterpublic.blob.core.windows.net/user-files/" + file;
    }

    autoTranslate() {
        let {subtype} = this.slide();
        let originalKey = this.key().replace(/_tr$/, "");
        let original = this.slide()[originalKey];

        if (originalKey == "location") {
            return (
                original.split(";").map((l: string) => translateBibleLoc(l, false)).join(";")
            );
        }

        for (let [regex, translated] of TITLE_TRANSLATIONS) {
            if (original.match(regex)) {
                return translated;
            }
        }

        if (subtype == "bible") {
            return "Bible Reading";
        }
    }

    autoVideoId(): string | void {
        let url = new URL(this.val());
        if (url.pathname == "/watch") {
            return url.searchParams.get("v")!;
        } else if (url.pathname.startsWith("/embed/")) {
            return url.pathname.split("/")[2];
        } else if (url.hostname == "youtu.be") {
            return url.pathname.slice(1);
        }
    }

    autoSwitch() {
        switch(this.key()) {
            case "preview":
                return this.autoPreview();
            case "start":
            case "end":
                return this.autoTimeConvert();
            case "imageSrc":
            case "subtitleSrc":
            case "videoSrc":
                return this.openFilePicker();
            case "title_tr":
            case "location_tr":
                return this.autoTranslate();
            case "videoId":
                return this.autoVideoId();
        }
    }

    auto() {
        let newVal = this.autoSwitch();
        if (newVal != undefined)
            this.valChange.emit(newVal);
    }
}