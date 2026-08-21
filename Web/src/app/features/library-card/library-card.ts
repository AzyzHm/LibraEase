import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, OnInit, PLATFORM_ID, effect, inject, viewChild } from '@angular/core';
import { animate } from 'motion';
import { AuthStore } from '../../core/state/auth-store';
import { MyLibraryCardStore } from '../../core/state/my-library-card-store';
import { LoadingState } from '../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { springStandard } from '../../shared/motion/springs';

@Component({
  selector: 'app-library-card',
  standalone: true,
  imports: [LoadingState, EmptyState, ErrorState],
  templateUrl: './library-card.html',
  styleUrl: './library-card.css'
})
export class LibraryCardPage implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  readonly authStore = inject(AuthStore);
  readonly store = inject(MyLibraryCardStore);

  private readonly cardEl = viewChild<ElementRef<HTMLElement>>('cardEl');

  constructor() {
    // The card is behind an @if that only resolves once the store finishes
    // loading, so the element doesn't exist on first render - an effect
    // reacting to the viewChild signal (same pattern as the navbar's mobile
    // menu) rather than a one-shot afterNextRender, which would miss it.
    effect(() => {
      const el = this.cardEl()?.nativeElement;
      if (!el || !isPlatformBrowser(this.platformId)) {
        return;
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      animate(
        el,
        { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0)'] },
        reducedMotion ? { duration: 0.001 } : springStandard
      );
    });
  }

  ngOnInit(): void {
    this.store.load();
  }

  onRetry(): void {
    this.store.load();
  }

  onPrint(): void {
    window.print();
  }
}