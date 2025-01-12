import { Component, output } from '@angular/core';
import { Playlist } from '../classes/playlist';
import { TextReader } from '../classes/utils';

const TEMPLATES: Array<[string, Array<string>]> = [
    ["welcome", ["year", "month", "day"]],
    ["bible", ["title", "location"]],
    ["song", ["title", "name"]],
    ["title", ["title", "subtitle"]],
    ["embed", ["url"]],
    ["youtube", ["videoId"]],
]
const SUBSLIDE_TEMPLATES_A = ["bible", "song"];
const SUBSLIDE_TEMPLATES_B = ["embed"];

@Component({
    selector: 'playlist-setup',
    templateUrl: './playlist-setup.component.html',
    styleUrl: './playlist-setup.component.css',

})
export class PlaylistSetupComponent {
    translations = {
        no_playlist_open: "No playlist open",
        open_playlist: "Open Playlist",
        or: "or",
        new_playlist: "New Playlist",
    }

    playlistParsed = output<Playlist>();

    async openPlaylist(e: Event) {
        let input = e.target as HTMLInputElement;

        if (!input.files) return;
        
        let file = input.files[0];
        if (file.type === "text/plain") {
            let text = await file.text();
            try {
                this.playlistParsed.emit(Playlist.fromText(text));
            } catch (e: any) {
                console.error(e);
                throw new Error(`Error parsing playlist line: ${e.message}`)
            }
        } else if (file.type == "application/json") {
            this.playlistParsed.emit(
                Playlist.fromJson(await file.text(), file.name)
            );
        }
    }
}
