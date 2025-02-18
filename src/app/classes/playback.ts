import { Slide } from "./playlist";

export class PlaybackRequest {
    slide: Slide | null = null;
    playRequest: "play" | "pause" | "stop" = "stop";

    constructor(slide?: Slide, playRequest?: "play" | "pause" | "stop") {
        this.slide = slide || null;
        this.playRequest = playRequest || "stop";
    }
}

export class PlaybackStatus {
    timeDisplay = "";
}