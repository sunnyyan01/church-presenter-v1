import { Component, ElementRef, HostListener, inject, input, model, output, signal, ViewChild } from "@angular/core";
import { BlobServiceClient } from "@azure/storage-blob";
import { Playlist } from "@app/classes/playlist";
import { ToastsService } from "@services/toasts.service";
import { FilePickerService } from "@services/file-picker.service";
import { NewPlaylistDialog } from "@presenter/new-playlist/new-playlist.dialog";

@Component({
    selector: 'playlist-btns',
    imports: [NewPlaylistDialog ],
    templateUrl: './playlist-btns.component.html',
    styleUrl: './playlist-btns.component.css',
})
export class PlaylistBtns {
    @ViewChild("fileInput") fileInput!: ElementRef<HTMLInputElement>;
    @ViewChild("openContextMenu") openContextMenu!: ElementRef<HTMLDivElement>;
    @ViewChild("saveContextMenu") saveContextMenu!: ElementRef<HTMLDivElement>;
    fp = inject(FilePickerService);
    toastService = inject(ToastsService);
    
    playlist = model<Playlist>();

    playlistSubmit = output<Playlist>();

    newPlaylistDialogOpen = signal<boolean>(false);
    newPlaylistDialogErr = signal<string>("");

    contextMenuOpen = signal<string>("");

    @HostListener('document:click', ['$event'])
    onClickOut(e: MouseEvent) {
        if (this.contextMenuOpen() == "open" && this.openContextMenu) {
            if (!this.openContextMenu.nativeElement.contains(e.target as Node | null)) {
                this.contextMenuOpen.set("");
            }
        }
        if (this.contextMenuOpen() == "save" && this.saveContextMenu) {
            if (!this.saveContextMenu.nativeElement.contains(e.target as Node | null)) {
                this.contextMenuOpen.set("");
            }
        }
    }

    showOpenContextMenu() {
        this.contextMenuOpen.update(prev => prev == "open" ? "" : "open");
    }
    showSaveContextMenu() {
        this.contextMenuOpen.update(prev => prev == "save" ? "" : "save");
    }

    confirmBeforeDiscard() {
        if (this.playlist()?.modified) {
            return confirm("The current playlist has not been saved and will be lost if you continue.");
        }
        return true;
    }

    async openPlaylist(e: Event) {
        let input = e.target as HTMLInputElement;

        if (!input.files) return;

        let file = input.files[0];
        let fileName = file.name.replace(/\..+?$/, "");
        if (file.type === "text/plain") {
            let text = await file.text();
            try {
                this.playlistSubmit.emit(Playlist.fromText(text, fileName));
            } catch (e: any) {
                console.error(e);
                this.toastService.createToast("error", `Error parsing playlist: ${e.message}`);
            }
        } else if (file.type == "application/json") {
            this.playlistSubmit.emit(
                Playlist.fromJson(await file.text(), fileName)
            );
        }
    }
    openPlaylistFileSelector() {
        this.contextMenuOpen.set("");

        if (!this.confirmBeforeDiscard()) return;
        this.fileInput.nativeElement.click();
    }
    async openCloudPlaylist() {
        this.contextMenuOpen.set("");

        let file = await this.fp.openFilePicker("playlists", "open") as string;
        if (!file) return;
        let resp = await fetch(
            "https://churchpresenterpublic.blob.core.windows.net/playlists/" + file
        );
        if (resp.headers.get("Content-Type") == "application/json") {
            this.playlistSubmit.emit(
                Playlist.fromJson(await resp.text(), file)
            );
        } else {
            this.playlistSubmit.emit(
                Playlist.fromText(await resp.text(), file)
            );
        }
    }

    newPlaylist() {
        if (!this.confirmBeforeDiscard()) return;

        this.newPlaylistDialogOpen.set(true);
    }
    onNewPlaylistSubmit(e: string) {
        if (e) {
            try {
                this.newPlaylistDialogErr.set("");
                this.playlistSubmit.emit(Playlist.fromText(e));
            } catch (err: any) {
                this.newPlaylistDialogErr.set(err.message);
                throw err;
            }
        }
        this.newPlaylistDialogOpen.set(false);
    }

    savePlaylist(e: MouseEvent) {
        this.contextMenuOpen.set("");

        if (this.playlist()?.isBlank()) {
            this.toastService.createToast("error", "Can't save blank playlist");
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
    async saveCloudPlaylist(e: MouseEvent) {
        this.contextMenuOpen.set("");

        if (this.playlist()?.isBlank()) {
            this.toastService.createToast("error", "Can't save blank playlist");
            return;
        }

        let content = e.ctrlKey ? this.playlist()?.toJson(2) : this.playlist()?.toText();
        let type = e.ctrlKey ? "application/json" : "text/plain";
        let name = await this.fp.openFilePicker("playlists", "save", this.playlist()?.name) as string;

        let serviceClient = new BlobServiceClient(localStorage.getItem("sas_url") as string);
        let containerClient = serviceClient.getContainerClient("playlists");
        let blobClient = containerClient.getBlockBlobClient(name);
        await blobClient.uploadData(
            new Blob([content!]),
            {blobHTTPHeaders: {blobContentType: type}}
        );
        this.toastService.createToast("success", "Saved successfully");
    }

    closePlaylist() {
        if (!this.confirmBeforeDiscard()) return;

        this.playlist.set(new Playlist());
        this.fileInput.nativeElement.value = "";
    }
}