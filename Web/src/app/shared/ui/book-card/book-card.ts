import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { BookModel } from '../../../core/models/book.model';
import { AuthStore } from '../../../core/state/auth-store';
import { SelfCheckoutStore } from '../../../core/state/self-checkout-store';
import { SelfCheckoutModal } from '../self-checkout-modal/self-checkout-modal';
import { BookDetailModal } from '../book-detail-modal/book-detail-modal';

@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [SelfCheckoutModal, BookDetailModal],
  templateUrl: './book-card.html',
  styleUrl: './book-card.css'
})
export class BookCard implements OnInit {
  private readonly authStore = inject(AuthStore);
  private readonly checkoutStore = inject(SelfCheckoutStore);

  readonly book = input.required<BookModel>();

  /** Flips to true once the cover <img> fails to load, so we can swap in a placeholder. */
  readonly coverFailed = signal(false);

  readonly showDetail = signal(false);
  readonly showCheckout = signal(false);

  readonly isPatron = this.authStore.isPatron;

  /** undefined = not checked yet, true = free to borrow, false = currently loaned out. */
  readonly available = computed(() => this.checkoutStore.availability()[this.book().id]);

  ngOnInit(): void {
    // Only patrons ever see the checkout button, so only they need the availability check fired.
    if (this.isPatron()) {
      this.checkoutStore.checkAvailability(this.book().id);
    }
  }

  onCoverError(): void {
    this.coverFailed.set(true);
  }

  openDetail(): void {
    this.showDetail.set(true);
  }

  closeDetail(): void {
    this.showDetail.set(false);
  }

  openCheckout(event: Event): void {
    event.stopPropagation();
    this.showCheckout.set(true);
  }

  closeCheckout(): void {
    this.showCheckout.set(false);
  }
}