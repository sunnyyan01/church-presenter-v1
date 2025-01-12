import { afterRender, Component, effect, input, signal } from '@angular/core';
import { Slide, YoutubeSlide } from '../../classes/playlist';

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
  player: any;
  playerReady = false;

  constructor() {
    effect(() => {
      this.bc().addEventListener("message", e => {
        let {slide, playPause, stop} = e.data;
        if (slide) {
          this.playbackSlide.set(slide);
        }
        if (playPause) {
          this.playPauseVideo();
        } else if (stop) {
          this.player.stopVideo();
        }
      })
    })

    effect(() => this.cueVideo(this.playbackSlide()));

    afterRender(() => {
      if (this.playerReady) return;
      this.player = new YT.Player(
        'youtube-player', {
          height: window.innerHeight.toString(),
          width: window.innerWidth.toString(),
          events: {
            onReady: () => {
              this.playerReady = true;
              this.cueVideo(this.playbackSlide());
            }
          }
        }
      );
    })
  }

  

  cueVideo(slide: YoutubeSlide | undefined) {
    if (!this.playerReady || !slide) return;
    if (this.player.getVideoUrl().includes(slide.videoId)) return;
    let startSeconds = slide.start ? parseFloat(slide.start) : undefined;
    let endSeconds = slide.end ? parseFloat(slide.end) : undefined;
    this.player.cueVideoById({
      videoId: this.playbackSlide()?.videoId,
      startSeconds, endSeconds
    });
  }

  playPauseVideo() {
    if (this.player.getPlayerState() === YT.PlayerState.PLAYING) {
      this.player.pauseVideo();
    } else {
        this.player.playVideo();
    }
  }
}
