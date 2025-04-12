import { Component, computed, effect, output, signal } from "@angular/core";

@Component({
    selector: 'remote-setup-dialog',
    styleUrl: './remote-setup.dialog.css',
    templateUrl: './remote-setup.dialog.html',
})
export class RemoteSetupDialog {
    remoteUrl = signal<string>("");
    qrSrc = computed(() => {
        let encoded = encodeURIComponent(this.remoteUrl());
        return `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&amp;size=300x300`;
    });
    closeDialog = output<void>();

    constructor() {
        effect(async () => {
            let resp = await fetch("/api/remote-qr")
            let url = await resp.text();
            this.remoteUrl.set(url);
        })
    }
}