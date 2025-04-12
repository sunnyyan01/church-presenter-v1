import { Component, signal } from "@angular/core";
import { SlideshowDispMode } from "../classes/slideshow";

@Component({
    styleUrl: 'remote.page.css',
    templateUrl: './remote.page.html',
})
export class RemotePage {
    ws: WebSocket;
    connectionStatus = signal<string>("unconnected");
    slideshowDispMode = signal<SlideshowDispMode | "">("");

    constructor() {
        let { hostname } = window.location;
        this.ws = new WebSocket(`ws://${hostname}:3000/ws/remote`);
        this.ws.addEventListener("open", e => {
            this.connectionStatus.set("connected");
        });
        this.ws.addEventListener("message", e => {
            let {origin, message} = JSON.parse(e.data);
            if (message.type === "error") {
                
            }
        });
        this.ws.addEventListener("close", e => {
            this.connectionStatus.set("disconnected");
        })
    }

    remoteEvent(type: string) {
        this.ws.send(JSON.stringify({
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