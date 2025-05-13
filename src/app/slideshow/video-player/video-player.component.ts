import { afterRender, Component, computed, effect, ElementRef, input, output, signal, ViewChild } from '@angular/core';
import { Slide, VideoMedia } from '../../classes/playlist';
import { timeConvert } from '../../classes/utils';
import { PlaybackRequest, PlaybackState } from '../../classes/slideshow';

@Component({
    selector: 'video-player',
    imports: [],
    templateUrl: './video-player.component.html',
    styleUrl: './video-player.component.css'
})
export class VideoPlayer {
    media = input.required<VideoMedia>();
    videoSrc = computed(() => {
        let {videoSrc, start, end} = this.media();
        if (!start && !end) {
            return videoSrc;
        }
        return (
            videoSrc + "#t=" +
            start || "0" +
            (end ? ("," + end) : "")
        );
    })
    playbackRequest = input.required<PlaybackRequest>();
    playbackTimerChange = output<string>();
    playbackTimerInterval: any;
    atStart = true;

    @ViewChild("player") player!: ElementRef<HTMLVideoElement>;

    constructor() {
        effect(() => {
            switch (this.playbackRequest().state) {
                case "play":
                    this.onPlay();
                    break;
                case "pause":
                    this.onPause();
                    break;
                case "stop":
                    this.onStop();
                    break;
            }
        })
    }

    onPlay() {
        if (!this.player?.nativeElement) return;
        
        this.player.nativeElement.play();
        this.playbackTimerInterval = setInterval(() => {
            let cur = timeConvert( this.player.nativeElement.currentTime );
            let len = timeConvert( this.player.nativeElement.duration );
            this.playbackTimerChange.emit(`${cur} / ${len}`);
        }, 1000)
    }

    onPause() {
        if (!this.player?.nativeElement) return;

        this.player.nativeElement.pause();
        clearInterval(this.playbackTimerInterval);
    }
    onStop() {
        if (!this.player?.nativeElement) return;

        this.onPause();
        this.player.nativeElement.currentTime = this.media().start || 0;
    }
}
