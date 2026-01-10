import { Component, input } from "@angular/core";

@Component({
    selector: "toast",
    templateUrl: "./toast.component.html",
    styleUrl: "./toast.component.css",
})
export class ToastComponent {
    type = input<string>();
    message = input<string>();
}