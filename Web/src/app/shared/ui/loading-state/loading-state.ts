import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading-state',
  standalone: true,
  templateUrl: './loading-state.html',
  styleUrl: './loading-state.css'
})
export class LoadingState {
  readonly message = input('Loading…');

  /** Use inside smaller/nested sections (e.g. a panel within a page) to reduce the vertical padding. */
  readonly compact = input(false);
}