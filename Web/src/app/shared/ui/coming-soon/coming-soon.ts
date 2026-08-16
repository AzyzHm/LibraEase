import { Component, input } from '@angular/core';

@Component({
  selector: 'app-coming-soon',
  standalone: true,
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.css'
})
export class ComingSoon {
  readonly title = input.required<string>();
  readonly phase = input<string>('a later phase');
}