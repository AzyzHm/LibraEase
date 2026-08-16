import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private readonly router = inject(Router);

  readonly searchTerm = signal('');

  onSearch(): void {
    const title = this.searchTerm().trim();
    this.router.navigate(['/catalog'], title ? { queryParams: { title } } : undefined);
  }
}