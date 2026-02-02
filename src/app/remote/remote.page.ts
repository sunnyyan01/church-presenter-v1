import { Component, signal } from "@angular/core";
import { WebPubSubClient } from "@azure/web-pubsub-client";
import { SlideshowDispMode } from "@app/classes/slideshow";

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
        let eventData = {
            origin: "remote",
            dest: "presenter",
            message: type,
        };
        this.client.sendToGroup("remote", eventData, "json");
    }

    changeSlideshowDispMode(mode: SlideshowDispMode) {
        this.slideshowDispMode.set(mode);
        this.remoteEvent(`slideshow-disp-mode-${mode}`)
    }
}