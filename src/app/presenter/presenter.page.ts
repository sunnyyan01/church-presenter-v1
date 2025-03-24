import { Component, HostListener, signal, effect } from '@angular/core';
import { PlaylistSection } from './playlist.section';
import { PreviewSection } from './preview.section';
import { ControlsSection } from './controls.section';
import { Playlist } from '../classes/playlist';
import { PlaybackRequest, PlaybackStatus } from '../classes/playback';
import { AboutSection } from "./about.section";

@Component({
    selector: 'presenter-page',
    imports: [PlaylistSection, PreviewSection, ControlsSection, AboutSection],
    templateUrl: './presenter.page.html',
    styleUrl: './presenter.page.css'
})
export class PresenterPage {
    playlist = signal<Playlist | null>(null, {equal: () => false});
    curSlideId = signal<string>("");
    curSubslideIdx = signal<number>(0);
    slideshowBc: BroadcastChannel;

    playbackBc: BroadcastChannel;
    playbackRequest = signal<PlaybackRequest>(new PlaybackRequest());
    playbackStatus = signal<PlaybackStatus>(new PlaybackStatus());

    constructor() {
        this.slideshowBc = new BroadcastChannel("slideshow");
        effect(() => {
            this.slideshowBc.postMessage({
                slide: this.playlist()?.byId(this.curSlideId())
            })
        })
        effect(() => {
            this.slideshowBc.postMessage({
                subslideIdx: this.curSubslideIdx()
            })
        })
        this.slideshowBc.onmessage = e => {
            if (e.data !== "refresh") return;
            this.slideshowBc.postMessage({
                slide: this.playlist()?.byId(this.curSlideId()),
                subslideIdx: this.curSubslideIdx(),
            })
        }

        this.playbackBc = new BroadcastChannel("playback");
        effect(() => {
            this.playbackBc.postMessage(this.playbackRequest());
        })
        this.playbackBc.addEventListener("message", e => {
            if (e.data.refresh)
                this.playbackBc.postMessage(this.playbackRequest());
            if (e.data.timeDisplay) {
                this.playbackStatus().timeDisplay = e.data.timeDisplay;
            }
        })
    }

    onPlaylistUpdate(slideId: string) {
        if (this.curSlideId() == slideId) {
            this.slideshowBc.postMessage({
                slide: this.playlist()?.byId(this.curSlideId())
            });
        }
    }

    @HostListener("window:keydown.arrowdown", ["$event"])
    @HostListener("window:keydown.control.arrowdown", ["$event"])
    @HostListener("window:keydown.arrowright", ["$event"])
    @HostListener("window:keydown.control.arrowright", ["$event"])
    nextSlide(e: KeyboardEvent | MouseEvent) {
        e.preventDefault();

        let curSlide = this.playlist()?.byId(this.curSlideId())
        if (!curSlide) return;

        if (!e.ctrlKey && this.curSubslideIdx() < curSlide.subslideCount) {
            this.curSubslideIdx.update(x => x + 1);
        } else {
            let nextSlide = this.playlist()?.byIdx(curSlide.idx + 1);
            if (!nextSlide) return;
            this.curSlideId.set(nextSlide.id);
            this.curSubslideIdx.set(0);
        }
    }

    @HostListener("window:keydown.arrowup", ["$event"])
    @HostListener("window:keydown.control.arrowup", ["$event"])
    @HostListener("window:keydown.arrowleft", ["$event"])
    @HostListener("window:keydown.control.arrowleft", ["$event"])
    prevSlide(e: KeyboardEvent | MouseEvent) {
        e.preventDefault();

        let curSlide = this.playlist()?.byId(this.curSlideId())
        if (!curSlide) return;

        if (!e.ctrlKey && this.curSubslideIdx() > 0) {
            this.curSubslideIdx.update(x => x - 1);
        } else {
            let nextSlide = this.playlist()?.byIdx(curSlide.idx - 1);
            if (!nextSlide) return;
            this.curSlideId.set(nextSlide.id);
            this.curSubslideIdx.set(0);
        }
    }

    @HostListener("window:keydown.b", [])
    blankSlide() {
        this.slideshowBc.postMessage({blank: "toggle"});
    }

    onPlaylistControl(e: MouseEvent) {
        let target = e.currentTarget as HTMLElement;
        let action = target?.dataset["action"];
        if (action == "next-slide") {
            this.nextSlide(e);
        } else if (action == "prev-slide") {
            this.prevSlide(e);
        } else if (action == "blank") {
            this.blankSlide();
        }
    }
}
