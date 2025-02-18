import { Component, computed, HostListener, model, output, signal } from "@angular/core";
import { PlaylistSetupComponent } from "./playlist-setup.component";
import { Playlist, Slide } from "../classes/playlist";
import { SlideComponent } from "./slide.component";
import { SlideContextMenu } from "./slide-context-menu.component";
import { EditDialog } from "./edit/edit.dialog";
import { EditDialogInput, EditDialogOutput } from "../classes/edit";
import { nextSunday } from "../classes/utils";
import { PlaybackRequest, PlaybackStatus } from "../classes/playback";

@Component({
    selector: 'playlist-section',
    imports: [EditDialog, PlaylistSetupComponent, SlideComponent, SlideContextMenu],
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

    playbackRequest = model<PlaybackRequest>(new PlaybackRequest());
    playbackStatus = model<PlaybackStatus>(new PlaybackStatus());

    slideContextMenuOpen = signal<string>("");
    slideContextMenuPos = signal<[number, number]>([0,0]);

    editSlideInput = signal<EditDialogInput | null>(null);

    onPlaylistInput(playlist: Playlist) {
        this.playlist.set(playlist);
    }

    savePlaylist() {
        let json = this.playlist()?.toJson(2) as string;
        let file = new File([json], this.playlist()?.name as string);
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

    onSlideSelect(e: [string, number]) {
        let [slideId, subslideIdx] = e;
        this.curSlideId.set(slideId);
        this.curSubslideIdx.set(subslideIdx);
    }

    onContextMenu(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();

        let target = e.currentTarget as HTMLElement;

        this.slideContextMenuPos.set([e.clientX, e.clientY])
        this.slideContextMenuOpen.set(target.dataset["id"] as string);
    }
    onContextMenuClose(e?: [string, string]) {
        this.slideContextMenuOpen.set("");

        if (!e) return;
        let [slideId, action] = e;
        switch (action) {
            case "edit":
                this.openEditDialog(slideId);
                break;
            case "move-up":
                this.moveSlide(slideId, -1);
                break;
            case "move-down":
                this.moveSlide(slideId, 1);
                break;
            case "insert-above":
                this.openInsertDialog(slideId, -1);
                break;
            case "insert-below":
                this.openInsertDialog(slideId, 1);
                break;
        }
    }
    
    @HostListener("keydown.control.e")
    openEditDialog(slideId?: string) {
        this.editSlideInput.set(
            new EditDialogInput(
                "edit",
                this.playlist()?.byId(slideId || this.curSlideId())
            )
        );
    }
    onCloseEditDialog(e: EditDialogOutput | null) {
        if (e) {
            if (e.mode == 'edit') {
                this.playlist()?.replaceSlide(e.slide);
            } else { // new
                this.playlist()?.pushSlide(e.slide);
            }
        }

        this.editSlideInput.set(null);
    }

    openInsertDialog(slideId: string, direction: 1 | -1) {
        this.editSlideInput.set(
            new EditDialogInput(
                "new",
                undefined,
                (this.playlist()?.byId(slideId) as Slide).idx + direction
            )
        );
    }

    moveSlide(slideId: string, direction: 1 | -1) {
        this.playlist()?.moveSlide(slideId, direction);
    }
    @HostListener("keydown.control.shift.arrowup", ['-1'])
    @HostListener("keydown.control.shift.arrowdown", ['1'])
    moveCurSlide(direction: 1 | -1) {
        this.moveSlide(this.curSlideId(), direction);
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