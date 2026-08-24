import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { animate } from 'motion';
import { AdminBooksStore } from '../../../core/state/admin-books-store';
import { Book, BookModel } from '../../../core/models/book.model';
import { LoadingState } from '../../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { springStandard } from '../../../shared/motion/springs';

const barcodeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value ?? '') as string;
  if (!value) return null;

  const stripped = value.replace(/-/g, '');
  const isIsbn10 = /^\d{9}[\dXx]$/.test(stripped);
  const isIsbn13 = /^\d{13}$/.test(stripped);

  return isIsbn10 || isIsbn13 ? null : { barcode: true };
};

@Component({
  selector: 'app-admin-books',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingState, EmptyState, ErrorState],
  templateUrl: './admin-books.html',
  styleUrl: './admin-books.css',
})
export class AdminBooks implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fb = inject(FormBuilder);
  readonly store = inject(AdminBooksStore);

  readonly filterForm = this.fb.nonNullable.group({
    title: [''],
    author: [''],
    genre: [''],
  });

  readonly bookForm = this.fb.nonNullable.group({
    barcode: ['', [Validators.required, barcodeValidator]],
    cover: ['', Validators.required],
    title: ['', Validators.required],
    authors: ['', Validators.required],
    description: ['', Validators.required],
    subjects: ['', Validators.required],
    publicationDate: ['', Validators.required],
    publisher: ['', Validators.required],
    pages: [1, [Validators.required, Validators.min(1)]],
    genre: ['', Validators.required],
  });

  readonly editingBook = signal<BookModel | null>(null);
  readonly showForm = signal(false);
  readonly submitted = signal(false);

  readonly confirmingDeleteBarcode = signal<string | null>(null);

  readonly hasActiveFilters = computed(() => {
    const filters = this.store.filters();
    return Boolean(filters.title || filters.author || filters.genre);
  });

  private readonly formPanel = viewChild<ElementRef<HTMLElement>>('formPanel');

  constructor() {
    effect(() => {
      const el = this.formPanel()?.nativeElement;
      if (!el || !isPlatformBrowser(this.platformId)) {
        return;
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      animate(
        el,
        { opacity: [0, 1], transform: ['translateY(-8px)', 'translateY(0)'] },
        reducedMotion ? { duration: 0.001 } : springStandard,
      );
    });
  }

  ngOnInit(): void {
    this.store.loadPage(1);
  }

  onRetry(): void {
    this.store.loadPage(this.store.currentPage());
  }

  onFilterSubmit(): void {
    this.store.applyFilters(this.filterForm.getRawValue());
  }

  onFilterClear(): void {
    this.filterForm.reset({ title: '', author: '', genre: '' });
    this.store.clearFilters();
  }

  onPrevious(): void {
    this.store.goToPage(this.store.currentPage() - 1);
  }

  onNext(): void {
    this.store.goToPage(this.store.currentPage() + 1);
  }

  onOpenCreate(): void {
    this.editingBook.set(null);
    this.submitted.set(false);
    this.bookForm.reset({ pages: 1 });
    this.bookForm.controls.barcode.enable();
    this.showForm.set(true);
  }

  onOpenEdit(book: BookModel): void {
    this.editingBook.set(book);
    this.submitted.set(false);
    this.bookForm.setValue({
      barcode: book.barcode,
      cover: book.cover,
      title: book.title,
      authors: book.authors.join(', '),
      description: book.description,
      subjects: book.subjects.join(', '),
      publicationDate: this.toDateInputValue(book.publicationDate),
      publisher: book.publisher,
      pages: book.pages,
      genre: book.genre,
    });
    this.bookForm.controls.barcode.disable();
    this.showForm.set(true);
  }

  onCancelForm(): void {
    this.showForm.set(false);
  }

  onSubmitForm(): void {
    this.submitted.set(true);
    if (this.bookForm.invalid) return;

    const raw = this.bookForm.getRawValue();
    const payload: Book = {
      barcode: raw.barcode,
      cover: raw.cover,
      title: raw.title,
      authors: this.toArray(raw.authors),
      description: raw.description,
      subjects: this.toArray(raw.subjects),
      publicationDate: raw.publicationDate,
      publisher: raw.publisher,
      pages: Number(raw.pages),
      genre: raw.genre,
    };

    const editing = this.editingBook();
    if (editing) {
      this.store.update({ ...payload, id: editing.id }, () => this.showForm.set(false));
    } else {
      this.store.create(payload, () => this.showForm.set(false));
    }
  }

  onDeleteRequest(book: BookModel): void {
    this.confirmingDeleteBarcode.set(book.barcode);
  }

  onDeleteCancel(): void {
    this.confirmingDeleteBarcode.set(null);
  }

  onDeleteConfirm(book: BookModel): void {
    this.confirmingDeleteBarcode.set(null);
    this.store.remove(book);
  }

  private toArray(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  /** ISO date/datetime string -> yyyy-MM-dd for the native date input. */
  private toDateInputValue(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }
}
