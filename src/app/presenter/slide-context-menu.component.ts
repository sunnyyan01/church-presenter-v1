import { Component, effect, ElementRef, HostListener, input, output, ViewChild } from "@angular/core";

@Component({
    selector: 'slide-context-menu',
    templateUrl: './slide-context-menu.component.html',
    styleUrl: './slide-context-menu.component.css',
})
export class SlideContextMenu {
    slideId = input.required<string>();
    action = output<[string, string]>();
    @ViewChild("contextMenuRoot") domElement!: ElementRef<HTMLDivElement>;

    constructor() {

    }

    @HostListener('document:click', ['$event'])
    onClickOut(e: MouseEvent) {
        if (!this.domElement.nativeElement.contains(e.target as Node | null)) {
            this.action.emit([this.slideId(), ""]); 
        }
    }

    onAction(e?: MouseEvent) {
        if (e) { 
            let action = (e.currentTarget as HTMLElement).dataset['action'] as string;
            this.action.emit([this.slideId(), action]);
        } else {
            this.action.emit([this.slideId(), ""]); 
        }
    }
}