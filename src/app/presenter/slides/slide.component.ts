import { Component, input, output } from '@angular/core';
import { Slide } from '../../classes/playlist';

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
    }
    handleSubslideClick(e: Event, subslideIdx: number) {
        e.stopPropagation();
        this.select.emit([this.data().id, subslideIdx]);
    }
}