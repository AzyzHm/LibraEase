import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { BookModel } from '../../../core/models/book.model';

@Component({
  selector: 'app-book-detail-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './book-detail-modal.html',
  styleUrl: './book-detail-modal.css'
})
export class BookDetailModal {
  readonly book = input.required<BookModel>();
  readonly closed = output<void>();

  onBackdropClick(): void {
    this.closed.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}