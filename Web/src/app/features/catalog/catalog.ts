import { Component, OnInit, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CatalogStore } from '../../core/state/catalog-store';
import { BookCard } from '../../shared/ui/book-card/book-card';
import { LoadingState } from '../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../shared/ui/error-state/error-state';
import { Pagination } from '../../shared/ui/pagination/pagination';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [ReactiveFormsModule, BookCard, LoadingState, EmptyState, ErrorState, Pagination],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(CatalogStore);

  readonly filterForm = this.fb.nonNullable.group({
    title: [''],
    author: [''],
    genre: [''],
  });

  readonly hasActiveFilters = computed(() => {
    const filters = this.store.filters();
    return Boolean(filters.title || filters.author || filters.genre);
  });

  ngOnInit(): void {
    const queryTitle = this.route.snapshot.queryParamMap.get('title');

    if (queryTitle) {
      const filters = { ...this.store.filters(), title: queryTitle };
      this.filterForm.setValue(filters);
      this.store.applyFilters(filters);
      return;
    }

    this.filterForm.setValue(this.store.filters());
    this.store.loadPage(this.store.currentPage());
  }

  onSubmit(): void {
    this.store.applyFilters(this.filterForm.getRawValue());
  }

  onClear(): void {
    this.filterForm.reset({ title: '', author: '', genre: '' });
    this.store.clearFilters();
  }

  onRetry(): void {
    this.store.loadPage(this.store.currentPage());
  }
}
