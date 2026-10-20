import { Component, input } from '@angular/core';
import { ContentSlide } from '@app/classes/playlist';

@Component({
  selector: 'content-template',
  imports: [],
  templateUrl: './content-template.component.html',
  styleUrl: './content-template.component.css'
})
export class ContentTemplateComponent {
  slide = input.required<ContentSlide>();
  subslideIdx = input.required<number>();
}
