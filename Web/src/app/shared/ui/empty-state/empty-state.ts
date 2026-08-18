import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css'
})
export class EmptyState {
  readonly message = input.required<string>();
  readonly actionLabel = input<string | null>(null);

  /** Use inside smaller/nested sections (e.g. a panel within a page) to reduce the vertical padding. */
  readonly compact = input(false);

  readonly action = output<void>();
}