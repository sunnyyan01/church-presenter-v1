import { Component, ElementRef, model, signal, ViewChild } from "@angular/core";
import { ControlsSection } from "./controls.section";
import { SlideshowDispMode } from "../classes/slideshow";

@Component({
    selector: 'preview-section',
    imports: [ControlsSection],
    templateUrl: './preview.section.html',
    styleUrl: './preview.section.css',
})
export class PreviewSection {
    translations = {
        header: "Preview",
        setup: "Setup",
    };
    inUse = signal(false);
    @ViewChild("previewFrame") video!: ElementRef<HTMLVideoElement>;

    slideshowDispMode = model<SlideshowDispMode>();

    async setupPreview() {
        let captureStream = await navigator.mediaDevices.getDisplayMedia();
        captureStream.getVideoTracks()[0].onended = () => {
            this.inUse.set(false);
        }
        
        let video = this.video.nativeElement;
        video.srcObject = captureStream;
        video.play();
        this.inUse.set(true);
    }
}