import { Component, effect, signal } from "@angular/core";

interface VersionInfo {
    num: string;
    date: string;
}

@Component({
    selector: 'about-section',
    templateUrl: './about.section.html',
    styles: `
    div.about-links {
        display: flex;
    }
    div.about-links > * {
        padding: 0px 5px;
        color: white;
        border-left: 1px solid white;
    }
    div.about-links > *:first-child {
        border: none;
    }
    `,
})
export class AboutSection {
    year = new Date().getFullYear();
    version = signal<VersionInfo | null>(null);

    constructor() {
        effect(() => this.checkVersion());
    }

    async checkVersion() {
        let resp = await fetch("https://api.github.com/repos/sunnyyan01/church-presenter-v1/commits/master");
        let json = await resp.json();
        this.version.set({
            num: json.commit.message.split(" - ")[0],
            date: json.commit.committer.date.split("T")[0],
        })
    }
}