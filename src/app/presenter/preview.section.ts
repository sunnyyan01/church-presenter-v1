import { Component, ElementRef, model, ViewChild } from "@angular/core";
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
    inUse = false;
    @ViewChild("previewFrame") video!: ElementRef<HTMLVideoElement>;

    slideshowDispMode = model<SlideshowDispMode>();

    async setupPreview() {
        let captureStream = await navigator.mediaDevices.getDisplayMedia();
        let video = this.video.nativeElement;
        video.srcObject = captureStream;
        video.play();
        this.inUse = true;
    }
}