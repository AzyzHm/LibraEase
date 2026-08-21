import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/state/auth-store';
import { PasswordVisibilityToggle } from '../../../shared/ui/password-visibility-toggle/password-visibility-toggle';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PasswordVisibilityToggle],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStore);

  readonly submitted = signal(false);
  readonly registered = signal(false);
  readonly loading = this.authStore.loading;
  readonly errorMessage = this.authStore.errorMessage;
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      firstname: ['', Validators.required],
      lastname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: passwordsMatchValidator }
  );

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.update((value) => !value);
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.form.invalid) {
      return;
    }

    const { confirmPassword, ...payload } = this.form.getRawValue();

    this.authStore.register(payload).subscribe({
      next: () => this.registered.set(true)
    });
  }
}