import { Component, HostListener, inject, model, output, signal } from "@angular/core";
import { Playlist, PlaylistItem } from "@app/classes/playlist";
import { EditDialogInput, EditDialogOutput } from "@app/classes/edit";
import { ContextMenu } from "@app/presenter/context-menu/context-menu.component";
import { EditDialog } from "@app/presenter/edit/edit.dialog";
import { SlideComponent } from "./slide.component";
import { RemoteService } from "@app/services/remote.service";

@Component({
    selector: 'slides-section',
    templateUrl: './slides.section.html',
    styleUrl: './slides.section.css',
    imports: [ContextMenu, EditDialog, SlideComponent]
})
export class SlidesSection {
    playlist = model<Playlist | null>();
    slideUpdate = output<string>();

    curSlideId = model<string>("");
    curSubslideIdx = model<number>(0);

    slideContextMenuOpen = signal<string>("");
    slideContextMenuPos = signal<[number, number]>([0,0]);

    editSlideInput = signal<EditDialogInput | null>(null);

    remoteService = inject(RemoteService);

    constructor() {
        this.remoteService.addListener("prev-slide", this.prevSlide.bind(this));
        this.remoteService.addListener("next-slide", this.nextSlide.bind(this));
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
                this.openEditDialog(undefined, slideId);
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
            case "delete":
                this.playlist()?.slides.delete(slideId);
                this.playlist()?.touch();
                break;
        }
    }
    
    @HostListener("window:keydown.control.e", ["$event"])
    openEditDialog(e?: KeyboardEvent, id?: string) {
        if (e) e.preventDefault();
        if (!id && !this.curSlideId()) return;

        this.editSlideInput.set({
            mode: "edit",
            type: "slide",
            playlistItem: this.playlist()?.slides.byId(id || this.curSlideId())
        });
    }
    onCloseEditDialog(e: EditDialogOutput | null) {
        if (e) {
            if (e.mode == 'edit') {
                this.playlist()?.replace(PlaylistItem.fromRecord(e.slide));
                if (e.slide['type'] == "slide")
                    this.slideUpdate.emit(e.slide["id"]);
            } else { // new
                this.playlist()?.push(PlaylistItem.fromRecord(e.slide));
            }
        }

        this.editSlideInput.set(null);
    }

    openInsertDialog(slideId: string, direction: 1 | -1) {
        this.editSlideInput.set({
            mode: 'new',
            type: 'slide',
            idx: this.playlist()?.slides.byId(slideId).idx! + direction,
        });
    }
    openInsertDialogAtEnd() {
        this.editSlideInput.set({
            mode: 'new',
            type: 'slide',
        })
    }

    moveSlide(slideId: string, direction: 1 | -1) {
        this.playlist()?.slides.move(slideId, direction);
        this.playlist()?.touch();
    }
    @HostListener("window:keydown.control.shift.arrowup", ['-1'])
    @HostListener("window:keydown.control.shift.arrowdown", ['1'])
    moveCurSlide(direction: 1 | -1) {
        this.moveSlide(this.curSlideId(), direction);
    }

    @HostListener("window:keydown.arrowdown", ["$event"])
    @HostListener("window:keydown.control.arrowdown", ["$event"])
    @HostListener("window:keydown.arrowright", ["$event"])
    @HostListener("window:keydown.control.arrowright", ["$event"])
    nextSlide(e?: KeyboardEvent | MouseEvent) {
        e?.preventDefault();

        let [nextSlideId, nextSubslideIdx] = this.playlist()?.nextSlide(
            this.curSlideId(), this.curSubslideIdx(), e?.ctrlKey
        )!;
        if (nextSlideId) {
            this.curSlideId.set(nextSlideId);
            this.curSubslideIdx.set(nextSubslideIdx);
        }
    }

    @HostListener("window:keydown.arrowup", ["$event"])
    @HostListener("window:keydown.control.arrowup", ["$event"])
    @HostListener("window:keydown.arrowleft", ["$event"])
    @HostListener("window:keydown.control.arrowleft", ["$event"])
    prevSlide(e?: KeyboardEvent | MouseEvent) {
        e?.preventDefault();

        let [prevSlideId, prevSubslideIdx] = this.playlist()?.prevSlide(
            this.curSlideId(), this.curSubslideIdx(), e?.ctrlKey
        )!;
        if (prevSlideId) {
            this.curSlideId.set(prevSlideId);
            this.curSubslideIdx.set(prevSubslideIdx);
        }
    }
}