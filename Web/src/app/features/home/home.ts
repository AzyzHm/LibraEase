import { Component, ElementRef, OnInit, afterNextRender, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { animate } from 'motion';
import { BookApi } from '../../core/api/book-api';
import { BookModel } from '../../core/models/book.model';
import { BookCard } from '../../shared/ui/book-card/book-card';
import { LoadingState } from '../../shared/ui/loading-state/loading-state';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { springStandard } from '../../shared/motion/springs';

/** How many books the "Featured picks" strip pulls from the catalog. */
const FEATURED_LIMIT = 8;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule, BookCard, LoadingState, ErrorState, EmptyState],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  private readonly router = inject(Router);
  private readonly bookApi = inject(BookApi);

  readonly searchTerm = signal('');

  readonly featuredBooks = signal<BookModel[]>([]);
  readonly featuredLoading = signal(true);
  readonly featuredError = signal<string | null>(null);

  private readonly heroContent = viewChild<ElementRef<HTMLElement>>('heroContent');

  constructor() {
    afterNextRender(() => {
      const el = this.heroContent()?.nativeElement;
      if (!el) {
        return;
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      animate(
        el,
        { opacity: [0, 1], transform: ['translateY(12px)', 'translateY(0)'] },
        reducedMotion ? { duration: 0.001 } : springStandard
      );
    });
  }

  ngOnInit(): void {
    this.loadFeatured();
  }

  loadFeatured(): void {
    this.featuredLoading.set(true);
    this.featuredError.set(null);

    this.bookApi.search({ page: 1, limit: FEATURED_LIMIT }).subscribe({
      next: (res) => {
        this.featuredBooks.set(res.page.items);
        this.featuredLoading.set(false);
      },
      error: () => {
        this.featuredError.set("Couldn't load featured books.");
        this.featuredLoading.set(false);
      }
    });
  }

  onSearch(): void {
    const title = this.searchTerm().trim();
    this.router.navigate(['/catalog'], title ? { queryParams: { title } } : undefined);
  }
}