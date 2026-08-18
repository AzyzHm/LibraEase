import { Component, input, signal } from '@angular/core';
import { BookModel } from '../../../core/models/book.model';

@Component({
  selector: 'app-book-card',
  standalone: true,
  templateUrl: './book-card.html',
  styleUrl: './book-card.css'
})
export class BookCard {
  readonly book = input.required<BookModel>();

  /** Flips to true once the cover <img> fails to load, so we can swap in a placeholder. */
  readonly coverFailed = signal(false);

  onCoverError(): void {
    this.coverFailed.set(true);
  }
}