import { Component, input } from '@angular/core';
import { Slide, WelcomeSlide } from '../../classes/playlist';

@Component({
  selector: 'welcome-template',
  imports: [],
  templateUrl: './welcome-template.component.html',
  styleUrl: './welcome-template.component.css'
})
export class WelcomeTemplateComponent {
  slide = input.required<WelcomeSlide>();
}
