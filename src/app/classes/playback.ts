export type PlaybackState = "play" | "pause" | "stop";
export class PlaybackRequest {
    state: PlaybackState = "stop";
}

export class PlaybackStatus {
    timeDisplay = "";
}