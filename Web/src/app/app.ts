import { Component } from '@angular/core';
import { Shell } from './core/layout/shell/shell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [Shell],
  templateUrl: './app.html'
})
export class App {}