import { Injectable } from "@angular/core";
import { WebPubSubClient } from "@azure/web-pubsub-client";

@Injectable({
    providedIn: 'root',
})
export class RemoteService {
    private _password;
    private _clientUrl: string;
    service: WebPubSubClient | null = null;
    listeners: Record<string, Array<Function>> = {};

    constructor() {
        this._password = localStorage.getItem("remote_password") || "";
        this._clientUrl = this._password ? this.generateClientUrl() : "";
        if (this._clientUrl) this.createClient();
    }

    generateClientUrl() {
        // TODO
        return this._password;
    }

    createClient() {
        this.service = new WebPubSubClient(this._clientUrl);
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

    get password() {
        return this._password;
    }
    set password(val: string) {
        this._password = val;
        localStorage.setItem("remote_password", this._password);
        this._clientUrl = this.generateClientUrl();
        this.createClient();
    }

    get clientUrl() {
        return this._clientUrl;
    }
    set clientUrl(val: string) {
        this._password = "";
        this._clientUrl = val;
        this.createClient();
    }

    get remoteUrl() {
        if (!this._clientUrl) return "";
        let url = new URL("/remote", window.origin);
        url.searchParams.set("clientUrl", this._clientUrl);
        return url.toString();
    }

    addListener(message: string, listener: Function) {
        if (!this.listeners[message])
            this.listeners[message] = [];
        this.listeners[message].push(listener);
    }
}