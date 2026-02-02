import { Component, input } from '@angular/core';
import { TitleSlide } from '@app/classes/playlist';

@Component({
  selector: 'title-template',
  imports: [],
  templateUrl: './title-template.component.html',
  styleUrl: './title-template.component.css'
})
export class TitleTemplateComponent {
  slide = input.required<TitleSlide>();
}
