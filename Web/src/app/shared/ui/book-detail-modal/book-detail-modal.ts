import { DatePipe } from '@angular/common';
import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';
import { animate } from 'motion';
import { BookModel } from '../../../core/models/book.model';
import { springStandard } from '../../motion/springs';

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

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    // Modals are explicitly a "gesture-adjacent" surface per springs.ts,
    // so opening uses the spring preset rather than a CSS transition.
    afterNextRender(() => {
      const el = this.panel()?.nativeElement;
      if (!el) {
        return;
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      animate(
        el,
        { opacity: [0, 1], transform: ['scale(0.96) translateY(8px)', 'scale(1) translateY(0)'] },
        reducedMotion ? { duration: 0.001 } : springStandard
      );
    });
  }

  onBackdropClick(): void {
    this.closed.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}