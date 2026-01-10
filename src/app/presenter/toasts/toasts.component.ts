import { Component, computed, signal } from "@angular/core";
import { ToastComponent } from "./toast.component";

interface Toast {
    id: number;
    type: "error" | "warning" | "info" | "success";
    message: string;
    timeout: number;
}

@Component({
    selector: 'toasts',
    imports: [ToastComponent],
    templateUrl: './toasts.component.html',
    styles: `
        .toasts {
            display: flex;
            flex-direction: column;
            position: absolute;
            bottom: 20px;
            right: 20px;
            z-index: 5;
        }
    `,
})
export class Toasts {
    toasts = signal<Record<number, Toast>>([]);
    toastsIt = computed(() => Object.values(this.toasts()));
    nextId = 0;
    
    constructor() {
        let bc = new BroadcastChannel("toasts");
        bc.addEventListener("message", (event) => {
            let toast = {...event.data, id: this.nextId++}
            this.toasts.update(prev => (
                {...prev, [toast.id]: toast}
            ));
            setTimeout(() => {
                this.toasts.update(prev => {
                    let updated = {...prev};
                    delete updated[toast.id];
                    return updated;
                })
            }, event.data.timeout);
        });
    }
}