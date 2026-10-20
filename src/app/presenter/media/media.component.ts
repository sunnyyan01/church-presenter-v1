import { Component, computed, input, output } from '@angular/core';
import { Media, MEDIA_ICONS } from '@app/classes/playlist';

@Component({
    selector: 'media',
    templateUrl: 'media.component.html',
    styleUrl: 'media.component.css',
})
export class MediaComponent {
    data = input.required<Media>();
    selected = input<boolean>(false);

    select = output<void>();

    subtypeIcon = computed(() => MEDIA_ICONS[this.data().subtype] || "")

    handleMediaClick() {
        this.select.emit();
    }
}