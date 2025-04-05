import { Component, signal, effect } from '@angular/core';
import { PlaylistSection } from './playlist.section';
import { PreviewSection } from './preview.section';
import { Playlist } from '../classes/playlist';
import { PlaybackRequest, PlaybackStatus, SlideshowDispMode } from '../classes/slideshow';
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
    slideshowDispMode = signal<SlideshowDispMode>("slide");
    curSlideId = signal<string>("");
    curSubslideIdx = signal<number>(0);
    curMediaId = signal<string>("");
    playbackRequest = signal<PlaybackRequest>(new PlaybackRequest());
    playbackStatus = signal<PlaybackStatus>(new PlaybackStatus());

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
                this.playbackStatus().timeDisplay = e.data.timeDisplay;
            }
        }
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
}
