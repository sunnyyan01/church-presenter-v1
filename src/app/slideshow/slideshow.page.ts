import { Component, computed, signal } from '@angular/core';
import { Slide, Media, BlankMedia, BlankSlide } from '../classes/playlist';
import { WelcomeTemplateComponent } from './welcome-template/welcome-template.component';
import { BibleTemplateComponent } from './bible-template/bible-template.component';
import { SongTemplateComponent } from './song-template/song-template.component';
import { TitleTemplateComponent } from './title-template/title-template.component';
import { YoutubePlayer } from './youtube-player/youtube-player.component';
import { PlaybackRequest } from '../classes/playback';

@Component({
    selector: 'slideshow-page',
    imports: [WelcomeTemplateComponent, BibleTemplateComponent, SongTemplateComponent, TitleTemplateComponent, YoutubePlayer],
    templateUrl: './slideshow.page.html',
    styleUrl: './slideshow.page.css'
})
export class SlideshowPage {
    slideshowBc: BroadcastChannel;
    slideRecord = signal<Record<string, any>>(new BlankSlide());
    slide = computed(() => Slide.fromRecord(this.slideRecord()));
    subslideIdx = signal<number>(0);
    showSlide = signal<boolean>(true);

    playbackBc: BroadcastChannel;
    mediaRecord = signal<Record<string, any>>(new BlankMedia());
    media = computed(() => Media.fromRecord(this.mediaRecord()));
    playbackRequest = signal<PlaybackRequest>(new PlaybackRequest());
    showMedia = signal<boolean>(false);

    constructor() {
        this.slideshowBc = new BroadcastChannel("slideshow");
        this.slideshowBc.postMessage("refresh");
        this.slideshowBc.onmessage = e => {
            let { slide, subslideIdx, showSlide } = e.data;
            if (slide && slide['subtype']) {
                this.slideRecord.set(slide);
            }
            if (subslideIdx >= 0) this.subslideIdx.set(subslideIdx);
            if (showSlide) this.showSlide.update(showSlide);
        }

        this.playbackBc = new BroadcastChannel("playback");
        this.playbackBc.postMessage("refresh");
        this.playbackBc.onmessage = e => {
            let {media, playbackRequest, showMedia } = e.data;
            if (media && media['subtype']) {
                this.mediaRecord.set(media);
            }
            if (playbackRequest) {
                this.playbackRequest.set(playbackRequest);
            }
            if (showMedia !== undefined) this.showMedia.set(showMedia);
        }
    }

    onPlaybackTimerChange(e: string) {
        this.playbackBc.postMessage(
            {timeDisplay: e}
        );
    }
}
