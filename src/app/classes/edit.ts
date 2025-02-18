import { Slide } from "./playlist";

export class EditDialogInput {
    mode: "edit" | "new";
    slide?: Slide;
    idx?: number;

    constructor(mode: "edit" | "new", slide?: Slide, idx?: number) {
        this.mode = mode;
        this.slide = slide;
        this.idx = idx;
    }

    toOutput(slide: Record<string, any>) {
        return new EditDialogOutput(this.mode, slide);
    }
}

export class EditDialogOutput {
    mode: "edit" | "new";
    slide: Record<string, any>;

    constructor(mode: "edit" | "new", slide: Record<string, any>) {
        this.mode = mode;
        this.slide = slide;
    }
}