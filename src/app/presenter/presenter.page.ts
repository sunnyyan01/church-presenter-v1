import { Component, signal, effect } from '@angular/core';
import { PlaylistSection } from './playlist.section';
import { PreviewSection } from './preview.section';
import { Playlist } from '../classes/playlist';
import { PlaybackRequest, PlaybackStatus, SlideshowDispMode } from '../classes/slideshow';
import { AboutSection } from "./about.section";
import { FilePicker } from "./file-picker/file-picker.dialog";

@Component({
    selector: 'presenter-page',
    imports: [PlaylistSection, PreviewSection, AboutSection, FilePicker],
    templateUrl: './presenter.page.html',
    styleUrl: './presenter.page.css'
})
export class PresenterPage {
    playlist = signal<Playlist | null>(null, {equal: () => false});

    slideshowBc: BroadcastChannel;
    slideshowDispMode = signal<SlideshowDispMode>("slide");
    curSlideId = signal<string>("");
    curSubslideIdx = signal<number>(0);
    curMediaId = signal<string>("");
    playbackRequest = signal<PlaybackRequest>(new PlaybackRequest());
    playbackStatus = signal<PlaybackStatus>(new PlaybackStatus());

    filePickerBc: BroadcastChannel;
    filePickerFolder = signal<string>("");
    filePickerAction = signal<"open" | "save">("open");

    ws: WebSocket | null = null;
    wsStatus = signal<string>("unconnected");

    REMOTE_HANDLERS: Record<string, Function> = {
        "prev-slide": this.prevSlide,
        "next-slide": this.nextSlide,
        "prev-media": this.prevMedia,
        "next-media": this.nextMedia,
        "slideshow-disp-mode-blank": () => this.slideshowDispMode.set("blank"),
        "slideshow-disp-mode-slide": () => this.slideshowDispMode.set("slide"),
        "slideshow-disp-mode-media": () => this.slideshowDispMode.set("media"),
        "play-pause": this.playPause,
        "stop": this.stop,
    };

    constructor() {
        this.slideshowBc = new BroadcastChannel("slideshow");
        effect(() => {
            this.slideshowBc.postMessage({
                slide: this.playlist()?.slides.byId(this.curSlideId())
            })
        })
        effect(() => {
            this.slideshowBc.postMessage({
                subslideIdx: this.curSubslideIdx()
            })
        })
        effect(() => {
            this.slideshowBc.postMessage({
                slideshowDispMode: this.slideshowDispMode()
            })
        })
        effect(() => {
            this.slideshowBc.postMessage({
                media: this.playlist()?.media.byId(this.curMediaId())
            });
        })
        effect(() => {
            this.slideshowBc.postMessage({
                playbackRequest: this.playbackRequest()
            });
        })
        this.slideshowBc.onmessage = e => {
            if (e.data === "refresh") {
                this.slideshowBc.postMessage({
                    slide: this.playlist()?.slides.byId(this.curSlideId()),
                    subslideIdx: this.curSubslideIdx(),
                    slideshowDispMode: this.slideshowDispMode(),
                    media: this.playlist()?.media.byId(this.curMediaId()),
                    playbackRequest: this.playbackRequest(),
                })
            }
            if (e.data.timeDisplay) {
                this.playbackStatus.update(
                    old => {
                        old.timeDisplay = e.data.timeDisplay;
                        return old;
                    }
                )
            }
        }

        if (sessionStorage.getItem("serverlessMode") === "true") {
            let { protocol, hostname } = window.location;
            let wsProtocol = protocol == "http:" ? "ws" : "wss";
            try {
                this.ws = new WebSocket(`${wsProtocol}://${hostname}:3000/ws/presenter`);
                this.ws.addEventListener("open", e => {
                    this.wsStatus.set("connected");
                });
                this.ws.addEventListener("message", e => {
                    let {origin, message} = JSON.parse(e.data);
                    console.log(e.data);
                    this.REMOTE_HANDLERS[message].bind(this)();
                });
                this.ws.addEventListener("close", e => {
                    this.wsStatus.set("disconnected");
                })
            } catch {}
        }

        this.filePickerBc = new BroadcastChannel("file-picker");
        this.filePickerBc.addEventListener("message", e => {
            this.filePickerFolder.set(e.data.folder);
            this.filePickerAction.set(e.data.action);
        })
    }

    onSlideUpdate(slideId: string) {
        if (this.curSlideId() == slideId) {
            this.slideshowBc.postMessage({
                slide: this.playlist()?.slides.byId(this.curSlideId())
            });
        }
    }
    onMediaUpdate(id: string) {
        if (this.curMediaId() == id) {
            this.slideshowBc.postMessage({
                media: this.playlist()?.media.byId(this.curSlideId())
            });
        }
    }

    prevSlide() {
        console.log(this.playlist);
        let [prevSlideId, prevSubslideIdx] = this.playlist()?.prevSlide(
            this.curSlideId(), this.curSubslideIdx()
        )!;
        if (prevSlideId) {
            this.curSlideId.set(prevSlideId);
            this.curSubslideIdx.set(prevSubslideIdx);
        }
    }
    nextSlide() {
        let [nextSlideId, nextSubslideIdx] = this.playlist()?.nextSlide(
            this.curSlideId(), this.curSubslideIdx()
        )!;
        if (nextSlideId) {
            this.curSlideId.set(nextSlideId);
            this.curSubslideIdx.set(nextSubslideIdx);
        }
    }

    prevMedia() {
        let prevMediaId = this.playlist()?.prevMedia(this.curMediaId());
        if (prevMediaId)
            this.curMediaId.set(prevMediaId);
    }
    nextMedia() {
        let nextMediaId = this.playlist()?.nextMedia(this.curMediaId());
        if (nextMediaId)
            this.curMediaId.set(nextMediaId);
    }

    playPause() {
        this.playbackRequest.update(r => ({
            state: r.state == "play" ? "pause" : "play"
        }));
    }

    stop() {
        this.playbackRequest.set({state: "stop"});
    }
    
    filePickerClose(file: string) {
        this.filePickerBc.postMessage({file});
        this.filePickerFolder.set("");
    }
}
