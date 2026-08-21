import { Component, ElementRef, afterNextRender, input, output, viewChild } from '@angular/core';
import { animate } from 'motion';
import { springStandard } from '../../motion/springs';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  templateUrl: './modal-shell.html'
})
export class ModalShell {
  readonly title = input.required<string>();

  /** Tailwind max-width utility for the panel, e.g. 'max-w-md', 'max-w-3xl'. */
  readonly maxWidthClass = input<string>('max-w-md');

  readonly closed = output<void>();

  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    // Modals are explicitly gesture-adjacent per springs.ts, so opening
    // uses the spring preset rather than a CSS transition.
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