import { Component, HostListener, model, output, signal } from "@angular/core";
import { SlideshowDispMode } from "../classes/slideshow";
import { RemoteSetupDialog } from "./remote-setup/remote-setup.dialog";

@Component({
    selector: 'controls-section',
    templateUrl: './controls.section.html',
    styleUrl: './controls.section.css',
    imports: [RemoteSetupDialog],
})
export class ControlsSection {
    serverlessMode = sessionStorage.getItem("serverlessMode");
    slideshowDispMode = model<SlideshowDispMode>();
    remoteSetupDialogOpen = signal<boolean>(false);

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

    openRemoteQr() {
        this.remoteSetupDialogOpen.set(true);
    }
    closeRemoteQr() {
        this.remoteSetupDialogOpen.set(false);
    }

    openSettings() {}
}