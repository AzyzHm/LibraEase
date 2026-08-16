import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { CatalogStore } from '../../core/state/catalog-store';
import { BookCard } from '../../shared/ui/book-card/book-card';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [ReactiveFormsModule, BookCard],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css'
})
export class Catalog implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(CatalogStore);

  readonly filterForm = this.fb.nonNullable.group({
    title: [''],
    author: [''],
    genre: ['']
  });

  ngOnInit(): void {
    // Restore any filters already held in the store (e.g. coming back from a book detail
    // page in a later phase) instead of always starting from a blank search.
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

  onPrevious(): void {
    this.store.goToPage(this.store.currentPage() - 1);
  }

  onNext(): void {
    this.store.goToPage(this.store.currentPage() + 1);
  }
}