import { Component, effect, ElementRef, inject, input, output } from '@angular/core';
import { Slide } from '@app/classes/playlist';

@Component({
    selector: 'slide',
    templateUrl: 'slide.component.html',
    styleUrl: 'slide.component.css',
})
export class SlideComponent {
    elementRef = inject(ElementRef);

    data = input.required<Slide>();
    selected = input<number>(-1);
    playbackTimer = input<string>("");

    select = output<[string, number]>();
    playbackEvent = output<string>();

    constructor() {
        effect(() => {
            if (this.selected()) {
                this.elementRef.nativeElement.scrollIntoView({block: "nearest", container: "nearest"});
            }
        })
    }

    handleSlideClick() {
        this.select.emit([this.data().id, 0]);
    }
    handleSubslideClick(e: Event, subslideIdx: number) {
        e.stopPropagation();
        this.select.emit([this.data().id, subslideIdx]);
    }
}