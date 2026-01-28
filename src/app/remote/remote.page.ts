import { Component, signal } from "@angular/core";
import { SlideshowDispMode } from "../classes/slideshow";
import { WebPubSubClient } from "@azure/web-pubsub-client";

@Component({
    styleUrl: 'remote.page.css',
    templateUrl: './remote.page.html',
})
export class RemotePage {
    client: WebPubSubClient;
    connectionStatus = signal<string>("unconnected");
    slideshowDispMode = signal<SlideshowDispMode | "">("");

    constructor() {
        const clientUrl = new URL(window.location.toString()).searchParams.get("clientUrl");
        this.client = new WebPubSubClient(clientUrl!);

        this.client.on("connected", () => {
            this.connectionStatus.set("connected");
        })
        this.client.start();
        this.client.joinGroup("remote");
    }

    remoteEvent(type: string) {
        this.client.sendToGroup("remote", JSON.stringify({
            origin: "remote",
            dest: "presenter",
            message: type,
        }))
        console.log(type);
    }

    changeSlideshowDispMode(mode: SlideshowDispMode) {
        this.slideshowDispMode.set(mode);
        this.remoteEvent(`slideshow-disp-mode-${mode}`)
    }
}