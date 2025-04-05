import { Component } from "@angular/core";

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
    version = '';
    versionDate = '';

    constructor() {
        this.checkVersion();
    }

    async checkVersion() {
        if (sessionStorage.getItem("serverlessMode") === "true") return;

        let resp = await fetch("/api/update/check");
        if (!resp.ok) return;
        let { curVersion, latestVersion } = await resp.json();
        this.version = curVersion.version;
        this.versionDate = new Date(curVersion.date).toLocaleDateString(
            undefined, { day: "numeric", month: "short", "year": "numeric" }
        );
    }

    openUpdater() { }
}