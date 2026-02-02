import { inject, Injectable } from "@angular/core";
import { WebPubSubClient } from "@azure/web-pubsub-client";
import { ToastsService } from "./toasts.service";

@Injectable({
    providedIn: 'root',
})
export class RemoteService {
    password;
    clientUrl = "";
    service: WebPubSubClient | null = null;
    listeners: Record<string, Array<Function>> = {};
    
    private toastService = inject(ToastsService);

    constructor() {
        this.password = localStorage.getItem("remote_password") || "";
        if (this.password) {
            this.generateClientUrl().then(() => this.createClient());
        }
    }

    private async generateClientUrl() {
        let resp = await fetch(
            "https://churchpresenterapi.azurewebsites.net/api/pubsub-token",
            {headers: {"Authorization": this.password}}
        );
        if (resp.ok) {
            this.clientUrl = await resp.text();
        } else {
            this.clientUrl = "";
            this.toastService.createToast("error", "Failed to connect to remote server: " + await resp.text());
        }
    }

    private createClient() {
        this.service = new WebPubSubClient(this.clientUrl);
        this.service.start();
        this.service.joinGroup("remote");
        this.service.on("group-message", e => {
            // @ts-ignore
            let message = e.message.data["message"];
            for (let listener of this.listeners[message]) {
                listener();
            }
        })
    }

    async setPassword(val: string) {
        this.password = val;
        localStorage.setItem("remote_password", this.password);
        if (!val) return;
        this.generateClientUrl().then(() => this.createClient());
    }

    async setClientUrl(val: string) {
        this.password = "";
        this.clientUrl = val;
        this.createClient();
    }

    get remoteUrl() {
        if (!this.clientUrl) return "";
        let url = new URL("/remote", window.origin);
        url.searchParams.set("clientUrl", this.clientUrl);
        return url.toString();
    }

    addListener(message: string, listener: Function) {
        if (!this.listeners[message])
            this.listeners[message] = [];
        this.listeners[message].push(listener);
    }
}