import { Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/state/auth-store';
import { PasswordVisibilityToggle } from '../../../shared/ui/password-visibility-toggle/password-visibility-toggle';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PasswordVisibilityToggle],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);

  /** Bound automatically from ?returnUrl= via withComponentInputBinding. */
  readonly returnUrl = input<string>('');

  readonly submitted = signal(false);
  readonly loading = this.authStore.loading;
  readonly errorMessage = this.authStore.errorMessage;
  readonly showPassword = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      return;
    }

    this.authStore.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl(this.returnUrl() || '/')
    });
  }
}