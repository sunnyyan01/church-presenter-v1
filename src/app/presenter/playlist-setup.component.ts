import { Component, output, signal } from '@angular/core';
import { Playlist } from '../classes/playlist';
import { NewPlaylistDialog } from './new-playlist/new-playlist.dialog';

@Component({
    selector: 'playlist-setup',
    templateUrl: './playlist-setup.component.html',
    styleUrl: './playlist-setup.component.css',
    imports: [ NewPlaylistDialog ],
})
export class PlaylistSetupComponent {
    translations = {
        no_playlist_open: "No playlist open",
        open_playlist: "Open Playlist",
        or: "or",
        new_playlist: "New Playlist",
    }

    playlistParsed = output<Playlist>();

    newPlaylistDialogOpen = signal<boolean>(false);
    newPlaylistDialogErr = signal<string>("");

    async openPlaylist(e: Event) {
        let input = e.target as HTMLInputElement;

        if (!input.files) return;
        
        let file = input.files[0];
        let fileName = file.name.replace(/\..+?$/,"");
        if (file.type === "text/plain") {
            let text = await file.text();
            try {
                this.playlistParsed.emit(Playlist.fromText(text, fileName));
            } catch (e: any) {
                console.error(e);
                throw new Error(`Error parsing playlist line: ${e.message}`)
            }
        } else if (file.type == "application/json") {
            this.playlistParsed.emit(
                Playlist.fromJson(await file.text(), fileName)
            );
        }
    }

    newPlaylist() {
        this.newPlaylistDialogOpen.set(true);
    }
    onNewPlaylistSubmit(e: string) {
        if (e) {
            try {
                this.newPlaylistDialogErr.set("");
                this.playlistParsed.emit(Playlist.fromText(e));
            } catch (err: any) {
                this.newPlaylistDialogErr.set(err.message);
                throw err;
            }
        }
        this.newPlaylistDialogOpen.set(false);
    }
}
