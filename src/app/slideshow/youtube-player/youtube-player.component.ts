import { afterRender, Component, computed, effect, input, signal } from '@angular/core';
import { Slide, YoutubeSlide } from '../../classes/playlist';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { timeConvert } from '../../classes/utils';

declare var YT: any;

@Component({
    selector: 'youtube-player',
    imports: [],
    templateUrl: './youtube-player.component.html',
    styleUrl: './youtube-player.component.css'
})
export class YoutubePlayer {
    bc = input.required<BroadcastChannel>();
    slide = input.required<Slide>();
    playbackSlide = signal<YoutubeSlide | undefined>(undefined);
    embedUrl = signal<SafeUrl | undefined>(undefined);
    player: any;
    playerReady = false;
    playbackTimerInterval: any;

    constructor() {
        effect(() => {
            this.bc().addEventListener("message", e => {
                console.log(e.data);
                let { slide, playRequest } = e.data;
                if (slide) {
                    this.playbackSlide.set(slide);
                }
                if (playRequest == 'play') {
                    this.player.playVideo();
                } else if (playRequest == 'pause') {
                    this.player.pauseVideo();
                } else { // stop
                    this.player.stopVideo();
                }
            })
        })

        effect(() => this.cueVideo(this.playbackSlide()));
    }

    cueVideo(slide: YoutubeSlide | undefined) {
        if (!slide) return;
        if (this.player?.getVideoUrl().includes(slide.videoId)) return;

        let startSeconds = slide.start ? parseFloat(slide.start) : undefined;
        let endSeconds = slide.end ? parseFloat(slide.end) : undefined;

        if (this.playerReady) {
            this.player.cueVideoById({
                videoId: this.playbackSlide()?.videoId,
                startSeconds, endSeconds
            });
        } else {
            this.player = new YT.Player('youtube-player', {
                events: {
                    onReady: (e: Event) => {
                        this.playerReady = true;
                        let player = e.target as any;
                        player.cueVideoById({
                            videoId: this.playbackSlide()?.videoId,
                            startSeconds, endSeconds
                        });
                        // console.log("cued");
                    },
                    onStateChange: (e: any) => {
                        if (e.data === YT.PlayerState.PLAYING) {
                            this.playbackTimerInterval = setInterval(() => {
                                let cur = timeConvert( this.player.getCurrentTime() );
                                let len = timeConvert( this.player.getDuration() );
                                this.bc().postMessage({timeDisplay: `${cur} / ${len}`});
                            }, 1000)
                        } else if (this.playbackTimerInterval) {
                            clearInterval(this.playbackTimerInterval);
                        }
                    }
                },
                width: window.innerWidth,
                height: window.innerHeight,
            });
            // console.log("player created");
        }
    }
}
