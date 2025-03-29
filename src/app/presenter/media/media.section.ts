import { Component, HostListener, input, model, output, signal } from "@angular/core";
import { Playlist, PlaylistItem } from "../../classes/playlist";
import { EditDialogInput, EditDialogOutput } from "../../classes/edit";
import { ContextMenu } from "../context-menu/context-menu.component";
import { EditDialog } from "../edit/edit.dialog";
import { MediaComponent } from "./media.component";
import { PlaybackRequest, PlaybackStatus } from "../../classes/playback";

@Component({
    selector: 'media-section',
    templateUrl: './media.section.html',
    styleUrl: './media.section.css',
    imports: [ContextMenu, EditDialog, MediaComponent,],
})
export class MediaSection {
    playlist = model<Playlist | null>();
    mediaUpdate = output<string>();
    curMediaId = model<string>("");
    playbackRequest = model<PlaybackRequest>(new PlaybackRequest());
    playbackStatus = input<PlaybackStatus>(new PlaybackStatus());
    showMedia = model<boolean>(false);

    contextMenuOpen = signal<string>("");
    contextMenuPos = signal<[number, number]>([0,0]);

    editDialogInput = signal<EditDialogInput | null>(null);

    onMediaSelect(e: string) {
        this.curMediaId.set(e);
    }

    onContextMenu(e: MouseEvent) {
        e.stopPropagation();
        e.preventDefault();

        let target = e.currentTarget as HTMLElement;

        this.contextMenuPos.set([e.clientX, e.clientY])
        this.contextMenuOpen.set(target.dataset["id"] as string);
    }
    onContextMenuClose(e?: [string, string]) {
        this.contextMenuOpen.set("");

        if (!e) return;
        let [id, action] = e;
        switch (action) {
            case "edit":
                this.openEditDialog(undefined, id);
                break;
            case "move-up":
                this.moveItem(id, -1);
                break;
            case "move-down":
                this.moveItem(id, 1);
                break;
            case "insert-above":
                this.openInsertDialog(id, -1);
                break;
            case "insert-below":
                this.openInsertDialog(id, 1);
                break;
            case "delete":
                this.playlist()?.media.delete(id);
                break;
        }
    }
    
    @HostListener("window:keydown.control.shift.e", ["$event"])
    openEditDialog(e?: KeyboardEvent, id?: string) {
        if (e) e.preventDefault();

        this.editDialogInput.set({
            mode: "edit",
            type: "media",
            playlistItem: this.playlist()?.media.byId(id || this.curMediaId())
        });
    }
    onCloseEditDialog(e: EditDialogOutput | null) {
        if (e) {
            if (e.mode == 'edit') {
                this.playlist()?.media.replace(PlaylistItem.fromRecord(e.slide));
                this.mediaUpdate.emit(e.slide["id"]);
            } else { // new
                this.playlist()?.media.push(PlaylistItem.fromRecord(e.slide));
            }
        }

        this.editDialogInput.set(null);
    }

    openInsertDialog(id: string, direction: 1 | -1) {
        this.editDialogInput.set({
            mode: 'new',
            type: 'media',
            idx: this.playlist()?.media.byId(id).idx! + direction,
        });
    }
    openInsertDialogAtEnd() {
        this.editDialogInput.set({
            mode: 'new',
            type: 'media',
        });
    }

    moveItem(id: string, direction: 1 | -1) {
        this.playlist()?.media.move(id, direction);
    }
    moveCurItem(direction: 1 | -1) {
        this.moveItem(this.curMediaId(), direction);
    }

    @HostListener("window:keydown.control.F11", ["$event"])
    @HostListener("window:keydown.MediaTrackPrevious", ["$event"])
    nextMedia(e: KeyboardEvent | MouseEvent) {
        e.preventDefault();

        let curMedia = this.playlist()?.slides.byId(this.curMediaId())
        if (!curMedia) return;
        let nextMedia = this.playlist()?.slides.byIdx(curMedia.idx + 1);
        if (!nextMedia) return;
        this.curMediaId.set(nextMedia.id);
    }

    @HostListener("window:keydown.control.F9", ["$event"])
    @HostListener("window:keydown.MediaTrackPrevious", ["$event"])
    prevMedia(e: KeyboardEvent | MouseEvent) {
        e.preventDefault();

        let curMedia = this.playlist()?.slides.byId(this.curMediaId())
        if (!curMedia) return;
        let prevMedia = this.playlist()?.slides.byIdx(curMedia.idx - 1);
        if (!prevMedia) return;
        this.curMediaId.set(prevMedia.id);
    }

    toggleShow() {
        this.showMedia.update(x => !x);
        console.log(this.showMedia());
    }

    @HostListener("window:keydown.control.F10")
    playPause() {
        this.playbackRequest.update(r => ({
            state: r.state == "play" ? "pause" : "play"
        }));
    }

    stop() {
        this.playbackRequest.set({state: "stop"});
    }
}