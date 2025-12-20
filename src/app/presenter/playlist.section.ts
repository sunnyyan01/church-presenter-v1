import { Component, ElementRef, input, model, output, signal, ViewChild } from "@angular/core";
import { Playlist } from "../classes/playlist";
import { PlaybackRequest, PlaybackStatus } from "../classes/slideshow";
import { SlidesSection } from "./slides/slides.section";
import { MediaSection } from "./media/media.section";
import { NewPlaylistDialog } from "./new-playlist/new-playlist.dialog";

@Component({
    selector: 'playlist-section',
    imports: [SlidesSection, MediaSection, NewPlaylistDialog],
    templateUrl: './playlist.section.html',
    styleUrl: './playlist.section.css',
})
export class PlaylistSection {
    translations = {
        header: "Playlist",
        close_playlist: "Close Playlist",
        save_playlist: "Save Playlist",
    };

    @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;

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

    newPlaylistDialogOpen = signal<boolean>(false);
    newPlaylistDialogErr = signal<string>("");

    confirmBeforeDiscard() {
        if (this.playlist()?.modified) {
            return confirm("The current playlist has not been saved and will be lost if you continue.");
        }
        return true;
    }

    onPlaylistInput(playlist: Playlist) {
        this.curSlideId.set("");
        this.curSubslideIdx.set(0);
        this.curMediaId.set("");
        this.showSlide.set(true);

        this.playbackRequest.set(new PlaybackRequest());
        this.showMedia.set(false);

        this.playlist.set(playlist);
    }
    async openPlaylist(e: Event) {
        let input = e.target as HTMLInputElement;

        if (!input.files) return;

        let file = input.files[0];
        let fileName = file.name.replace(/\..+?$/, "");
        if (file.type === "text/plain") {
            let text = await file.text();
            try {
                this.onPlaylistInput(Playlist.fromText(text, fileName));
            } catch (e: any) {
                console.error(e);
                throw new Error(`Error parsing playlist line: ${e.message}`)
            }
        } else if (file.type == "application/json") {
            this.onPlaylistInput(
                Playlist.fromJson(await file.text(), fileName)
            );
        }
    }
    openPlaylistFileSelector() {
        if (!this.confirmBeforeDiscard()) return;
        this.fileInput.nativeElement.click();
    }

    newPlaylist() {
        if (!this.confirmBeforeDiscard()) return;


        this.newPlaylistDialogOpen.set(true);
    }
    onNewPlaylistSubmit(e: string) {
        if (e) {
            try {
                this.newPlaylistDialogErr.set("");
                this.onPlaylistInput(Playlist.fromText(e));
            } catch (err: any) {
                this.newPlaylistDialogErr.set(err.message);
                throw err;
            }
        }
        this.newPlaylistDialogOpen.set(false);
    }

    savePlaylist(e: MouseEvent) {
        if (this.playlist()?.isBlank()) {
            alert("Can't save blank playlist");
            return;
        }

        let content = e.ctrlKey ? this.playlist()?.toJson(2) : this.playlist()?.toText();
        let type = e.ctrlKey ? "application/json" : "text/plain";
        let file = new File([content!], this.playlist()?.name!, { type });
        let url = URL.createObjectURL(file);
        let a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    closePlaylist() {
        if (!this.confirmBeforeDiscard()) return;

        this.playlist.set(new Playlist());
        this.fileInput.nativeElement.value = "";
    }

    onSlideUpdate(id: string) {
        this.slideUpdate.emit(id);
    }
    onMediaUpdate(id: string) {
        this.mediaUpdate.emit(id);
    }
}