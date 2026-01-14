import { Component, input } from '@angular/core';
import { ImageSlide } from '../../classes/playlist';

@Component({
  selector: 'image-template',
  templateUrl: './image-template.component.html',
  styles: `
    .image-template img {
        width: 100vw;
        height: 100vh;
        object-fit: contain;
    }
  `
})
export class ImageTemplateComponent {
  slide = input.required<ImageSlide>();
}
