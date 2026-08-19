import { Component, OnInit, inject, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthStore } from '../../../core/state/auth-store';
import { ProfileStore } from '../../../core/state/profile-store';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './edit-profile-modal.html',
  styleUrl: './edit-profile-modal.css'
})
export class EditProfileModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  readonly store = inject(ProfileStore);

  /** Emitted when the modal should be dismissed - backdrop click, close button, or Escape. */
  readonly closed = output<void>();

  readonly submitted = signal(false);

  readonly form = this.fb.nonNullable.group({
    firstname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    // Clear any success/error message left over from the last time this was opened.
    this.store.resetProfileFeedback();

    const user = this.authStore.user();
    if (user) {
      this.form.setValue({ firstname: user.firstname, lastname: user.lastname, email: user.email });
    }
  }

  onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.store.saveProfile(this.form.getRawValue());
  }

  onBackdropClick(): void {
    this.closed.emit();
  }

  onClose(): void {
    this.closed.emit();
  }
}