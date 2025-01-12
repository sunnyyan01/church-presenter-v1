import { Component, output } from "@angular/core";

@Component({
    selector: 'controls-section',
    templateUrl: './controls.section.html',
    styleUrl: './controls.section.css',
})
export class ControlsSection {
    playlistControl = output<MouseEvent>();

    onClick(e: MouseEvent) {
        this.playlistControl.emit(e);
    }

    openSlideshow() {
        window.open("slideshow", "slideshow", "popup");
    }

    openRemoteQr() {}

    openSettings() {}
}