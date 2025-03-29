import { Component, input, model, output } from "@angular/core";
import { PlaylistSetupComponent } from "./playlist-setup.component";
import { Playlist } from "../classes/playlist";
import { PlaybackRequest, PlaybackStatus } from "../classes/playback";
import { SlidesSection } from "./slides/slides.section";
import { MediaSection } from "./media/media.section";

@Component({
    selector: 'playlist-section',
    imports: [PlaylistSetupComponent, SlidesSection, MediaSection],
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

    savePlaylist(e: MouseEvent) {
        let content = e.ctrlKey ? this.playlist()?.toJson(2) : this.playlist()?.toText();
        let type = e.ctrlKey ? "application/json" : "text/plain";
        let file = new File([content!], this.playlist()?.name!, {type});
        let url = URL.createObjectURL(file);
        let a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    closePlaylist() {
        this.playlist.set(null);
    }

    onSlideUpdate(id: string) {
        this.slideUpdate.emit(id);
    }
    onMediaUpdate(id: string) {
        this.mediaUpdate.emit(id);
    }
}