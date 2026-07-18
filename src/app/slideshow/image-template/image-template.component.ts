import { Component, input } from '@angular/core';
import { ImageMedia } from '@app/classes/playlist';

@Component({
  selector: 'image-template',
  templateUrl: './image-template.component.html',
  styles: `
    .image-template img {
        width: 100vw;
        height: 100vh;
    }
  `
})
export class ImageTemplateComponent {
  media = input.required<ImageMedia>();
}
