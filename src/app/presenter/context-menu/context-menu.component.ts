import { Component, ElementRef, HostListener, input, output, ViewChild } from "@angular/core";

@Component({
    selector: 'context-menu',
    templateUrl: './context-menu.component.html',
    styleUrl: './context-menu.component.css',
})
export class ContextMenu {
    id = input.required<string>();
    type = input.required<string>();
    action = output<[string, string]>();
    @ViewChild("contextMenuRoot") domElement!: ElementRef<HTMLDivElement>;

    @HostListener('document:click', ['$event'])
    onClickOut(e: MouseEvent) {
        if (!this.domElement.nativeElement.contains(e.target as Node | null)) {
            this.action.emit([this.id(), ""]); 
        }
    }

    onAction(e?: MouseEvent) {
        if (e) { 
            let action = (e.currentTarget as HTMLElement).dataset['action'] as string;
            this.action.emit([this.id(), action]);
        } else {
            this.action.emit([this.id(), ""]); 
        }
    }
}