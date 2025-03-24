import { Component, HostListener, model, output, signal } from "@angular/core";
import { Playlist, PlaylistItem, Slide } from "../../classes/playlist";
import { EditDialogInput, EditDialogOutput } from "../../classes/edit";
import { ContextMenu } from "../context-menu/context-menu.component";
import { EditDialog } from "../edit/edit.dialog";
import { SlideComponent } from "../slides/slide.component";

@Component({
    selector: 'media-section',
    templateUrl: './media.section.html',
    styleUrl: './media.section.css',
    imports: [ContextMenu, EditDialog, ]
})
export class MediaSection {
    playlist = model<Playlist | null>();
    forcePlaylistUpdate = output<string>();
    curSlideId = model<string>("");
    curSubslideIdx = model<number>(0);

    slideContextMenuOpen = signal<string>("");
    slideContextMenuPos = signal<[number, number]>([0,0]);

    editSlideInput = signal<EditDialogInput | null>(null);

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
                this.openEditDialog(undefined, slideId);
                break;
            case "move-up":
                this.moveItem(slideId, -1);
                break;
            case "move-down":
                this.moveItem(slideId, 1);
                break;
            case "insert-above":
                this.openInsertDialog(slideId, -1);
                break;
            case "insert-below":
                this.openInsertDialog(slideId, 1);
                break;
            case "delete":
                this.playlist()?.slides.delete(slideId);
                break;
        }
    }
    
    @HostListener("window:keydown.control.e", ["$event"])
    openEditDialog(e?: KeyboardEvent, id?: string) {
        if (e) e.preventDefault();

        this.editSlideInput.set({
            mode: "edit",
            type: "media",
            playlistItem: this.playlist()?.slides.byId(id || this.curSlideId())
        });
    }
    onCloseEditDialog(e: EditDialogOutput | null) {
        if (e) {
            if (e.mode == 'edit') {
                this.playlist()?.replace(PlaylistItem.fromRecord(e.slide));
                if (e.slide['type'] == "slide")
                    this.forcePlaylistUpdate.emit(e.slide["id"]);
            } else { // new
                this.playlist()?.push(PlaylistItem.fromRecord(e.slide));
            }
        }

        this.editSlideInput.set(null);
    }

    openInsertDialog(id: string, direction: 1 | -1) {
        this.editSlideInput.set({
            mode: 'new',
            type: 'slide',
            idx: this.playlist()?.slides.byId(id).idx! + direction,
        });
    }

    moveItem(slideId: string, direction: 1 | -1) {
        this.playlist()?.slides.move(slideId, direction);
    }
    @HostListener("window:keydown.control.shift.arrowup", ['-1'])
    @HostListener("window:keydown.control.shift.arrowdown", ['1'])
    moveCurItem(direction: 1 | -1) {
        this.moveItem(this.curSlideId(), direction);
    }
}