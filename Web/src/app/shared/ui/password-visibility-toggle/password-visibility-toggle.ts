import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-password-visibility-toggle',
  standalone: true,
  templateUrl: './password-visibility-toggle.html',
})
export class PasswordVisibilityToggle {
  readonly visible = input.required<boolean>();
  readonly toggled = output<void>();
}
