import { Component, computed, input } from '@angular/core';
import { SongSlide, TitleSlide } from '../../classes/playlist';

@Component({
  selector: 'song-template',
  imports: [],
  templateUrl: './song-template.component.html',
  styleUrl: './song-template.component.css'
})
export class SongTemplateComponent {
  slide = input.required<SongSlide>();
  subslideIdx = input.required<number>();
}
