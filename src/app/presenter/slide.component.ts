import { Component, input, output } from '@angular/core';
import { Slide, YoutubeSlide } from '../classes/playlist';

@Component({
    selector: 'slide',
    templateUrl: 'slide.component.html',
    styleUrl: 'slide.component.css',
})
export class SlideComponent {
    data = input.required<Slide>();
    selected = input<number>(-1);

    select = output<[string, number]>();
    playbackEvent = output<Record<string, any>>();

    handleSlideClick() {
        this.select.emit([this.data().id, 0]);
        if (this.data().hasPlayback) {
            this.playbackEvent.emit({slide: this.data()});
        }
    }
    handleSubslideClick(e: Event, subslideIdx: number) {
        e.stopPropagation();
        this.select.emit([this.data().id, subslideIdx]);
    }

    playPause(e: MouseEvent) {
        e.stopPropagation();
        if (this.selected() == -1)
            this.playbackEvent.emit((this.data() as YoutubeSlide).videoId);
        this.playbackEvent.emit({playPause: 1});
    }
    stop(e: MouseEvent) {
        e.stopPropagation();
        this.playbackEvent.emit({stop: 1});
    }
}