import { Component, computed, input } from '@angular/core';
import { BibleSlide, TitleSlide } from '../../classes/playlist';

@Component({
  selector: 'bible-template',
  imports: [],
  templateUrl: './bible-template.component.html',
  styleUrl: './bible-template.component.css'
})
export class BibleTemplateComponent {
  slide = input.required<BibleSlide>();
  subslideIdx = input.required<number>();
}
