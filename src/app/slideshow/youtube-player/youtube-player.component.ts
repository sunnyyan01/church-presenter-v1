import { afterRender, Component, computed, effect, input, output, signal } from '@angular/core';
import { Slide, YoutubeMedia } from '../../classes/playlist';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { timeConvert } from '../../classes/utils';
import { PlaybackRequest, PlaybackState } from '../../classes/slideshow';

declare var YT: any;

@Component({
    selector: 'youtube-player',
    imports: [],
    templateUrl: './youtube-player.component.html',
    styleUrl: './youtube-player.component.css'
})
export class YoutubePlayer {
    media = input.required<YoutubeMedia>();
    playbackRequest = input.required<PlaybackRequest>();
    playbackTimerChange = output<string>();
    player: any;
    playerReady = false;
    playbackTimerInterval: any;

    constructor() {
        effect(() => {
            switch (this.playbackRequest().state) {
                case "play":
                    this.player.playVideo();
                    break;
                case "pause":
                    this.player.pauseVideo();
                    break;
                case "stop":
                    this.player.stopVideo();
                    break;
            }
        })

        effect(() => this.cueVideo(this.media()));
    }

    cueVideo(media: YoutubeMedia) {
        if (!media) return;
        if (this.player?.getVideoUrl().includes(media.videoId)) return;

        let startSeconds = media.start ? parseFloat(media.start) : undefined;
        let endSeconds = media.end ? parseFloat(media.end) : undefined;

        if (this.playerReady) {
            this.player.cueVideoById({
                videoId: media.videoId,
                startSeconds, endSeconds
            });
        } else {
            this.player = new YT.Player('youtube-player', {
                events: {
                    onReady: (e: Event) => {
                        this.playerReady = true;
                        let player = e.target as any;
                        player.cueVideoById({
                            videoId: media.videoId,
                            startSeconds, endSeconds
                        });
                        // console.log("cued");
                    },
                    onStateChange: (e: any) => {
                        if (e.data === YT.PlayerState.PLAYING) {
                            this.playbackTimerInterval = setInterval(() => {
                                let cur = timeConvert( this.player.getCurrentTime() );
                                let len = timeConvert( this.player.getDuration() );
                                this.playbackTimerChange.emit(`${cur} / ${len}`);
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
