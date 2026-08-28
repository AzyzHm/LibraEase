import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { AdminBooksStore } from '../../../core/state/admin-books-store';
import { Book, BookModel } from '../../../core/models/book.model';
import { LoadingState } from '../../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../../shared/ui/error-state/error-state';
import { Pagination } from '../../../shared/ui/pagination/pagination';
import { ModalShell } from '../../../shared/ui/modal-shell/modal-shell';

const barcodeValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value ?? '') as string;
  if (!value) return null;

  const stripped = value.replace(/-/g, '');
  const isIsbn10 = /^\d{9}[\dXx]$/.test(stripped);
  const isIsbn13 = /^\d{13}$/.test(stripped);

  return isIsbn10 || isIsbn13 ? null : { barcode: true };
};

const coverUrlValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value ?? '') as string;
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? null : { coverUrl: true };
  } catch {
    return { coverUrl: true };
  }
};

const pastPublicationDateValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const value = (control.value ?? '') as string;
  if (!value) return null;

  const chosen = new Date(`${value}T00:00:00`);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return chosen.getTime() < startOfToday.getTime() ? null : { notPast: true };
};

const integerValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { integer: true };
};

const nonEmptyListValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = (control.value ?? '') as string;
  const hasEntry = value
    .split(',')
    .map((item) => item.trim())
    .some((item) => item.length > 0);
  return hasEntry ? null : { required: true };
};

@Component({
  selector: 'app-admin-books',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingState, EmptyState, ErrorState, Pagination, ModalShell],
  templateUrl: './admin-books.html',
  styleUrl: './admin-books.css',
})
export class AdminBooks implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly store = inject(AdminBooksStore);

  readonly filterForm = this.fb.nonNullable.group({
    title: [''],
    author: [''],
    genre: [''],
  });

  readonly bookForm = this.fb.nonNullable.group({
    barcode: ['', [Validators.required, barcodeValidator]],
    cover: ['', [Validators.required, coverUrlValidator]],
    title: ['', Validators.required],
    authors: ['', [Validators.required, nonEmptyListValidator]],
    description: ['', Validators.required],
    subjects: ['', [Validators.required, nonEmptyListValidator]],
    publicationDate: ['', [Validators.required, pastPublicationDateValidator]],
    publisher: ['', Validators.required],
    pages: [1, [Validators.required, Validators.min(1), integerValidator]],
    genre: ['', Validators.required],
  });

  readonly editingBook = signal<BookModel | null>(null);
  readonly showForm = signal(false);
  readonly submitted = signal(false);

  readonly confirmingDeleteBarcode = signal<string | null>(null);

  readonly maxPublicationDate = this.isoDate(this.addDays(new Date(), -1));

  readonly hasActiveFilters = computed(() => {
    const filters = this.store.filters();
    return Boolean(filters.title || filters.author || filters.genre);
  });

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

  private toDateInputValue(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 10);
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private isoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
