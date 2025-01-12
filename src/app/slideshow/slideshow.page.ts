import { Component, signal } from '@angular/core';
import { Slide, BlankSlide } from '../classes/playlist';
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
    slide = signal<Slide>(new BlankSlide());
    subslideIdx = signal<number>(0);

    slideshowBc: BroadcastChannel;
    playbackBc: BroadcastChannel;

    constructor() {
        this.slideshowBc = new BroadcastChannel("slideshow");
        this.slideshowBc.postMessage("refresh");
        this.slideshowBc.onmessage = e => {
            let {slide: newSlide, subslideIdx: newSubslideIdx} = e.data;
            console.log(newSlide);
            if (newSlide) this.slide.set(newSlide);
            if (newSubslideIdx) this.subslideIdx.set(newSubslideIdx);
        }

        this.playbackBc = new BroadcastChannel("playback");
    }
}
