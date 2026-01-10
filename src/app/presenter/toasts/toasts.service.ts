import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class ToastsService {
    private bc = new BroadcastChannel("toasts");

    createToast(type: string, message: string, timeout?: number) {
        this.bc.postMessage({
            type,
            message,
            timeout: timeout || 5000,
        });
    }
}