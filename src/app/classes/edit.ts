import { PlaylistItem } from "./playlist";

export interface EditDialogInput {
    mode: "edit" | "new";
    type: string;
    playlistItem?: PlaylistItem;
    idx?: number;
}

export interface EditDialogOutput {
    mode: "edit" | "new";
    slide: Record<string, any>;
}