import { Component, computed, effect, inject, output, signal } from "@angular/core";
import { WebPubSubClientCredential } from "@azure/web-pubsub-client";
import { RemoteService } from "./remote.service";

@Component({
    selector: 'remote-setup-dialog',
    styleUrl: './remote-setup.dialog.css',
    templateUrl: './remote-setup.dialog.html',
})
export class RemoteSetupDialog {
    remoteService = inject(RemoteService);
    password = signal<string>(this.remoteService.password);
    remoteUrl = signal<string>(this.remoteService.remoteUrl);
    qrSrc = computed(() => {
        if (!this.remoteUrl()) return "";
        let encoded = encodeURIComponent(this.remoteUrl());
        return `https://api.qrserver.com/v1/create-qr-code/?data=${encoded}&amp;size=300x300`;
    });
    closeDialog = output<void>();

    changePassword() {
        let newPassword = window.prompt("Enter the password:") || "";
        this.password.set(newPassword);
        this.remoteService.password = newPassword;
        this.remoteUrl.set(this.remoteService.remoteUrl);
    }
}