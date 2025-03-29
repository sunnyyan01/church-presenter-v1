import { Component, effect, HostListener, model, output, signal } from "@angular/core";
import { Playlist, PlaylistItem, Slide } from "../../classes/playlist";
import { EditDialogInput, EditDialogOutput } from "../../classes/edit";
import { ContextMenu } from "../context-menu/context-menu.component";
import { EditDialog } from "../edit/edit.dialog";
import { SlideComponent } from "./slide.component";

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
    showSlide = model<boolean>(true);

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
                break;
        }
    }
    
    @HostListener("window:keydown.control.e", ["$event"])
        openEditDialog(e?: KeyboardEvent, id?: string) {
            if (e) e.preventDefault();
    
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
    nextSlide(e: KeyboardEvent | MouseEvent) {
        e.preventDefault();

        let curSlide = this.playlist()?.slides.byId(this.curSlideId())
        if (!curSlide) return;

        if (!e.ctrlKey && this.curSubslideIdx() < curSlide.subslideCount) {
            this.curSubslideIdx.update(x => x + 1);
        } else {
            let nextSlide = this.playlist()?.slides.byIdx(curSlide.idx + 1);
            if (!nextSlide) return;
            this.curSlideId.set(nextSlide.id);
            this.curSubslideIdx.set(0);
        }
    }

    @HostListener("window:keydown.arrowup", ["$event"])
    @HostListener("window:keydown.control.arrowup", ["$event"])
    @HostListener("window:keydown.arrowleft", ["$event"])
    @HostListener("window:keydown.control.arrowleft", ["$event"])
    prevSlide(e: KeyboardEvent | MouseEvent) {
        e.preventDefault();

        let curSlide = this.playlist()?.slides.byId(this.curSlideId())
        if (!curSlide) return;

        if (!e.ctrlKey && this.curSubslideIdx() > 0) {
            this.curSubslideIdx.update(x => x - 1);
        } else {
            let nextSlide = this.playlist()?.slides.byIdx(curSlide.idx - 1);
            if (!nextSlide) return;
            this.curSlideId.set(nextSlide.id);
            this.curSubslideIdx.set(0);
        }
    }

    @HostListener("window:keydown.b", [])
    blankSlide() {
        this.showSlide.update(x => !x);
    }
}