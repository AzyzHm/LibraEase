import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthStore } from '../../../core/state/auth-store';

function passwordsMatchValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmPassword = control.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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