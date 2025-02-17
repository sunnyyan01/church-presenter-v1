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
    playbackTimer = input<string>("");

    select = output<[string, number]>();
    playbackEvent = output<string>();

    handleSlideClick() {
        this.select.emit([this.data().id, 0]);
        if (this.data().hasPlayback) {
            this.playbackEvent.emit("cue");
        }
    }
    handleSubslideClick(e: Event, subslideIdx: number) {
        e.stopPropagation();
        this.select.emit([this.data().id, subslideIdx]);
    }

    play(e: MouseEvent) {
        e.stopPropagation();
        if (this.selected() == -1)
            this.playbackEvent.emit("cue");
        this.playbackEvent.emit("play");
    }
    pause(e: MouseEvent) {
        e.stopPropagation();
        this.playbackEvent.emit("pause");
    }
    stop(e: MouseEvent) {
        e.stopPropagation();
        this.playbackEvent.emit("stop");
    }
}