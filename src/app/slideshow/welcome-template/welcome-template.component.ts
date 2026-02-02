import { Component, input } from '@angular/core';
import { WelcomeSlide } from '@app/classes/playlist';

@Component({
  selector: 'welcome-template',
  imports: [],
  templateUrl: './welcome-template.component.html',
  styleUrl: './welcome-template.component.css'
})
export class WelcomeTemplateComponent {
  slide = input.required<WelcomeSlide>();
}
