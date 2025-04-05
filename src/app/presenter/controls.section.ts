import { Component, HostListener, model, output } from "@angular/core";
import { SlideshowDispMode } from "../classes/slideshow";

@Component({
    selector: 'controls-section',
    templateUrl: './controls.section.html',
    styleUrl: './controls.section.css',
})
export class ControlsSection {
    slideshowDispMode = model<SlideshowDispMode>();

    changeSlideshowDispMode(mode: SlideshowDispMode) {
        this.slideshowDispMode.set(mode);
    }

    @HostListener("window:keydown.b", ["$event"])
    @HostListener("window:keydown.shift.b", ["$event"])
    toggleSlideshowDispMode(e: KeyboardEvent) {
        this.slideshowDispMode.update(m => {
            if (e.shiftKey) {
                return m == "blank" ? "slide" : "blank";
            } else {
                return m == "slide" ? "media" : "slide";
            }
        })
    }

    openSlideshow() {
        window.open("slideshow", "slideshow", "popup");
    }

    openRemoteQr() {}

    openSettings() {}
}