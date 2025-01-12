import { Component, computed, HostListener, model, output } from "@angular/core";
import { PlaylistSetupComponent } from "./playlist-setup.component";
import { Playlist, Slide } from "../classes/playlist";
import { SlideComponent } from "./slide.component";

@Component({
    selector: 'playlist-section',
    imports: [PlaylistSetupComponent, SlideComponent],
    templateUrl: './playlist.section.html',
    styleUrl: './playlist.section.css',
})
export class PlaylistSection {
    translations = {
        header: "Playlist",
        close_playlist: "Close Playlist",
        save_playlist: "Save Playlist",
    };

    playlist = model<Playlist | null>();
    curSlideId = model<string>("");
    curSubslideIdx = model<number>(0);

    playbackEvent = output<Record<string, any>>();

    onPlaylistInput(playlist: Playlist) {
        this.playlist.set(playlist);
    }

    savePlaylist() {}

    closePlaylist() {
        this.playlist.set(null);
    }

    onSlideSelect(e: [string, number]) {
        let [slideId, subslideIdx] = e;
        this.curSlideId.set(slideId);
        this.curSubslideIdx.set(subslideIdx);
    }
    
    onPlaybackEvent(e: Record<string, any>) {
        this.playbackEvent.emit(e);
    }
}