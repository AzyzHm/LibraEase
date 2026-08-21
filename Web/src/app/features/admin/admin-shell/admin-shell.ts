import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, effect, inject, viewChild, viewChildren } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { animate } from 'motion';
import { springSnappy } from '../../../shared/motion/springs';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.css'
})
export class AdminShell {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  private readonly navigationEnd = toSignal(
    this.router.events.pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd)),
    { initialValue: null }
  );

  private readonly tabs = viewChildren<ElementRef<HTMLAnchorElement>>('tab');
  private readonly indicator = viewChild<ElementRef<HTMLElement>>('indicator');

  constructor() {
    // Small, frequent UI change (switching tabs) rather than a one-off
    // open/close, so this uses the snappier spring preset. Re-runs on every
    // route change and whenever the tab elements themselves (re)render.
    effect(() => {
      this.navigationEnd();
      const tabs = this.tabs();
      const indicatorEl = this.indicator()?.nativeElement;

      if (!indicatorEl || tabs.length === 0 || !isPlatformBrowser(this.platformId)) {
        return;
      }

      // routerLinkActive applies its class in the same change-detection
      // pass as the navigation, but on a fresh page load the tab elements
      // may not have their final layout yet - wait a frame before measuring.
      requestAnimationFrame(() => {
        const activeTab = tabs.find((tab) => tab.nativeElement.classList.contains('admin-tab-active'))?.nativeElement;
        if (!activeTab) {
          return;
        }

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        animate(
          indicatorEl,
          { left: `${activeTab.offsetLeft}px`, width: `${activeTab.offsetWidth}px` },
          reducedMotion ? { duration: 0.001 } : springSnappy
        );
      });
    });
  }
}