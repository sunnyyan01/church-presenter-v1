import { Component, computed, HostListener, model, output, signal } from "@angular/core";
import { PlaylistSetupComponent } from "./playlist-setup.component";
import { Playlist, Slide } from "../classes/playlist";
import { EditDialog } from "./edit/edit.dialog";
import { PlaybackRequest, PlaybackStatus } from "../classes/playback";
import { SlidesSection } from "./slides/slides.section";

@Component({
    selector: 'playlist-section',
    imports: [EditDialog, PlaylistSetupComponent, SlidesSection],
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
    forcePlaylistUpdate = output<string>();
    curSlideId = model<string>("");
    curSubslideIdx = model<number>(0);

    playbackRequest = model<PlaybackRequest>(new PlaybackRequest());
    playbackStatus = model<PlaybackStatus>(new PlaybackStatus());

    onPlaylistInput(playlist: Playlist) {
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

    onPlaylistUpdate(slideId: string) {
        this.forcePlaylistUpdate.emit(slideId);
    }

    onPlaybackEvent(e: string, slide: Slide) {
        if (e == 'cue') {
            this.playbackRequest.set(new PlaybackRequest(slide, "stop"));
        } else {
            this.playbackRequest.set(new PlaybackRequest(slide, e as any));
            if (e == 'stop') {
                this.playbackStatus.set(new PlaybackStatus());
            }
        }
    }
}