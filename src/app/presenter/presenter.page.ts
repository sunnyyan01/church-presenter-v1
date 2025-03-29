import { Component, signal, effect } from '@angular/core';
import { PlaylistSection } from './playlist.section';
import { PreviewSection } from './preview.section';
import { Playlist } from '../classes/playlist';
import { PlaybackRequest, PlaybackStatus } from '../classes/playback';
import { AboutSection } from "./about.section";

@Component({
    selector: 'presenter-page',
    imports: [PlaylistSection, PreviewSection, AboutSection],
    templateUrl: './presenter.page.html',
    styleUrl: './presenter.page.css'
})
export class PresenterPage {
    playlist = signal<Playlist | null>(null, {equal: () => false});

    slideshowBc: BroadcastChannel;
    curSlideId = signal<string>("");
    curSubslideIdx = signal<number>(0);
    showSlide = signal<boolean>(true);

    playbackBc: BroadcastChannel;
    curMediaId = signal<string>("");
    playbackRequest = signal<PlaybackRequest>(new PlaybackRequest());
    playbackStatus = signal<PlaybackStatus>(new PlaybackStatus());
    showMedia = signal<boolean>(false);

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
                showSlide: this.showSlide()
            })
        })
        this.slideshowBc.onmessage = e => {
            if (e.data !== "refresh") return;
            this.slideshowBc.postMessage({
                slide: this.playlist()?.slides.byId(this.curSlideId()),
                subslideIdx: this.curSubslideIdx(),
            })
        }

        this.playbackBc = new BroadcastChannel("playback");
        effect(() => {
            this.playbackBc.postMessage({
                media: this.playlist()?.media.byId(this.curMediaId())
            });
        })
        effect(() => {
            this.playbackBc.postMessage({
                playbackRequest: this.playbackRequest()
            });
        })
        effect(() => {
            console.log("here");
            this.playbackBc.postMessage({
                showMedia: this.showMedia()
            })
        })
        this.playbackBc.addEventListener("message", e => {
            if (e.data.refresh)
                this.playbackBc.postMessage(this.playbackRequest());
            if (e.data.timeDisplay) {
                this.playbackStatus().timeDisplay = e.data.timeDisplay;
            }
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
            this.playbackBc.postMessage({
                media: this.playlist()?.media.byId(this.curSlideId())
            });
        }
    }
}
