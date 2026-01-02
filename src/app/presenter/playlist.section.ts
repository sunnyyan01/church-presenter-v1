import { Component, ElementRef, input, model, output, signal, ViewChild } from "@angular/core";
import { Playlist } from "../classes/playlist";
import { PlaybackRequest, PlaybackStatus } from "../classes/slideshow";
import { SlidesSection } from "./slides/slides.section";
import { MediaSection } from "./media/media.section";
import { NewPlaylistDialog } from "./new-playlist/new-playlist.dialog";
import { PlaylistBtns } from "./playlist-btns/playlist-btns.component";

@Component({
    selector: 'playlist-section',
    imports: [SlidesSection, MediaSection, PlaylistBtns],
    templateUrl: './playlist.section.html',
    styleUrl: './playlist.section.css',
})
export class PlaylistSection {
    translations = {
        header: "Playlist",
        close_playlist: "Close Playlist",
        save_playlist: "Save Playlist",
    };


    playlist = model<Playlist>();
    slideUpdate = output<string>();
    curSlideId = model<string>("");
    curSubslideIdx = model<number>(0);
    showSlide = model<boolean>(true);

    curMediaId = model<string>("");
    mediaUpdate = output<string>();
    playbackRequest = model<PlaybackRequest>(new PlaybackRequest());
    playbackStatus = input<PlaybackStatus>(new PlaybackStatus());
    showMedia = model<boolean>(false);

    onPlaylistInput(playlist: Playlist) {
        this.curSlideId.set("");
        this.curSubslideIdx.set(0);
        this.curMediaId.set("");
        this.showSlide.set(true);

        this.playbackRequest.set(new PlaybackRequest());
        this.showMedia.set(false);

        this.playlist.set(playlist);
    }

    onSlideUpdate(id: string) {
        this.slideUpdate.emit(id);
    }
    onMediaUpdate(id: string) {
        this.mediaUpdate.emit(id);
    }
}