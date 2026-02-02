import { Component, HostListener, inject, input, model, output, signal } from "@angular/core";
import { Playlist, PlaylistItem } from "@app/classes/playlist";
import { EditDialogInput, EditDialogOutput } from "@app/classes/edit";
import { PlaybackRequest, PlaybackStatus } from "@app/classes/slideshow";
import { ContextMenu } from "@presenter/context-menu/context-menu.component";
import { EditDialog } from "@presenter/edit/edit.dialog";
import { MediaComponent } from "./media.component";
import { RemoteService } from "@services/remote.service";

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

    contextMenuOpen = signal<string>("");
    contextMenuPos = signal<[number, number]>([0,0]);

    editDialogInput = signal<EditDialogInput | null>(null);

    remoteService = inject(RemoteService);

    constructor() {
        this.remoteService.addListener("prev-media", this.prevMedia.bind(this));
        this.remoteService.addListener("next-media", this.nextMedia.bind(this));
        this.remoteService.addListener("play-pause", this.playPause.bind(this));
        this.remoteService.addListener("stop", this.stop.bind(this));
    }

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
            case "open":
                this.openMediaExternally(id);
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

    openMediaExternally(id: string) {
        window.open(this.playlist()?.media.byId(id).externalOpenUrl);
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
    nextMedia(e?: KeyboardEvent | MouseEvent) {
        e?.preventDefault();
        let nextMediaId = this.playlist()?.nextMedia(this.curMediaId());
        if (nextMediaId)
            this.curMediaId.set(nextMediaId);
    }

    @HostListener("window:keydown.control.F9", ["$event"])
    @HostListener("window:keydown.MediaTrackPrevious", ["$event"])
    prevMedia(e?: KeyboardEvent | MouseEvent) {
        e?.preventDefault();
        let prevMediaId = this.playlist()?.prevMedia(this.curMediaId());
        if (prevMediaId)
            this.curMediaId.set(prevMediaId);
    }

    @HostListener("window:keydown.control.F10")
    @HostListener("window:keydown.MediaPlayPause")
    playPause() {
        this.playbackRequest.update(r => ({
            state: r.state == "play" ? "pause" : "play"
        }));
    }

    stop() {
        this.playbackRequest.set({state: "stop"});
    }
}