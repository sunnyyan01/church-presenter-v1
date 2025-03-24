import { Component, input, output } from '@angular/core';
import { Media } from '../../classes/playlist';

@Component({
    selector: 'media',
    templateUrl: 'media.component.html',
    styleUrl: 'media.component.css',
})
export class MediaComponent {
    data = input.required<Media>();
    selected = input<boolean>(false);

    select = output<string>();

    handleSlideClick() {
        this.select.emit(this.data().id);
    }
}