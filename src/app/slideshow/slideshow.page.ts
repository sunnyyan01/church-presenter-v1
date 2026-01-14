import { Component, computed, signal } from '@angular/core';
import { Slide, Media, BlankMedia, BlankSlide } from '../classes/playlist';
import { WelcomeTemplateComponent } from './welcome-template/welcome-template.component';
import { BibleTemplateComponent } from './bible-template/bible-template.component';
import { SongTemplateComponent } from './song-template/song-template.component';
import { TitleTemplateComponent } from './title-template/title-template.component';
import { YoutubePlayer } from './youtube-player/youtube-player.component';
import { PlaybackRequest, SlideshowDispMode } from '../classes/slideshow';
import { VideoPlayer } from "./video-player/video-player.component";
import { ImageTemplateComponent } from "./image-template/image-template.component";

@Component({
    selector: 'slideshow-page',
    imports: [WelcomeTemplateComponent, BibleTemplateComponent, SongTemplateComponent, TitleTemplateComponent, YoutubePlayer, VideoPlayer, ImageTemplateComponent],
    templateUrl: './slideshow.page.html',
    styleUrl: './slideshow.page.css'
})
export class SlideshowPage {
    slideshowBc: BroadcastChannel;
    slideRecord = signal<Record<string, any>>(new BlankSlide());
    slide = computed(() => Slide.fromRecord(this.slideRecord()));
    subslideIdx = signal<number>(0);
    mediaRecord = signal<Record<string, any>>(new BlankMedia());
    media = computed(() => Media.fromRecord(this.mediaRecord()));
    playbackRequest = signal<PlaybackRequest>(new PlaybackRequest());
    slideshowDispMode = signal<SlideshowDispMode>("slide");

    constructor() {
        this.slideshowBc = new BroadcastChannel("slideshow");
        this.slideshowBc.postMessage("refresh");
        this.slideshowBc.onmessage = e => {
            let { slide, subslideIdx, media, playbackRequest, slideshowDispMode } = e.data;
            if (slide && slide['subtype']) {
                this.slideRecord.set(slide);
            }
            if (subslideIdx >= 0) this.subslideIdx.set(subslideIdx);
            if (media && media['subtype']) {
                this.mediaRecord.set(media);
            }
            if (playbackRequest) {
                this.playbackRequest.set(playbackRequest);
            }
            if (slideshowDispMode) {
                this.slideshowDispMode.set(slideshowDispMode);
            }
        }
    }

    onPlaybackTimerChange(e: string) {
        this.slideshowBc.postMessage(
            {timeDisplay: e}
        );
    }
}
