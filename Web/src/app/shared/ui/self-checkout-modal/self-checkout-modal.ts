import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { BookModel } from '../../../core/models/book.model';
import { SelfCheckoutStore } from '../../../core/state/self-checkout-store';
import { ModalShell } from '../modal-shell/modal-shell';

@Component({
  selector: 'app-self-checkout-modal',
  standalone: true,
  imports: [ReactiveFormsModule, ModalShell],
  templateUrl: './self-checkout-modal.html',
  styleUrl: './self-checkout-modal.css',
})
export class SelfCheckoutModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(SelfCheckoutStore);

  readonly book = input.required<BookModel>();
  readonly closed = output<void>();

  readonly submitted = signal(false);
  readonly saving = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);

  /** Earliest selectable due date - tomorrow, since the due date must land strictly after right now. */
  readonly minDate = this.isoDate(this.addDays(new Date(), 1));

  readonly form = this.fb.nonNullable.group({
    dueDate: ['', [Validators.required, this.futureDateValidator]],
  });

  ngOnInit(): void {
    this.form.patchValue({ dueDate: this.minDate });
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;

    this.saving.set(true);
    this.error.set(null);

    const dueDateIso = new Date(`${this.form.getRawValue().dueDate}T00:00:00`).toISOString();

    this.store.checkout(this.book().id, dueDateIso).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(this.store.extractErrorMessage(err));
      },
    });
  }

  onClose(): void {
    this.closed.emit();
  }

  private futureDateValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const chosen = new Date(`${control.value}T00:00:00`);
    return chosen.getTime() > Date.now() ? null : { notFuture: true };
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
