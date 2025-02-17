import { Component, computed, signal } from '@angular/core';
import { Slide, BlankSlide, BibleSlide, SLIDE_CONSTRUCTORS } from '../classes/playlist';
import { WelcomeTemplateComponent } from './welcome-template/welcome-template.component';
import { BibleTemplateComponent } from './bible-template/bible-template.component';
import { SongTemplateComponent } from './song-template/song-template.component';
import { TitleTemplateComponent } from './title-template/title-template.component';
import { YoutubePlayer } from './youtube-player/youtube-player.component';

@Component({
    selector: 'slideshow-page',
    imports: [WelcomeTemplateComponent, BibleTemplateComponent, SongTemplateComponent, TitleTemplateComponent, YoutubePlayer],
    templateUrl: './slideshow.page.html',
    styleUrl: './slideshow.page.css'
})
export class SlideshowPage {
    slideRecord = signal<Record<string, any>>({'template': 'blank'});
    slide = computed(() => Slide.fromRecord(this.slideRecord()));
    subslideIdx = signal<number>(0);
    blank = signal<boolean>(false);

    slideshowBc: BroadcastChannel;
    playbackBc: BroadcastChannel;

    constructor() {
        this.slideshowBc = new BroadcastChannel("slideshow");
        this.slideshowBc.postMessage("refresh");
        this.slideshowBc.onmessage = e => {
            let { slide: newSlide, subslideIdx: newSubslideIdx, blank } = e.data;
            if (newSlide && newSlide['template']) {
                this.slideRecord.set(newSlide);
            }
            if (newSubslideIdx) this.subslideIdx.set(newSubslideIdx);
            if (blank) this.blank.update(x => !x);
        }

        this.playbackBc = new BroadcastChannel("playback");
        this.playbackBc.postMessage("refresh");
    }
}
