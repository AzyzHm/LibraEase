import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.html',
  styleUrl: './pagination.css',
})
export class Pagination {
  readonly currentPage = input.required<number>();
  readonly totalPages = input.required<number>();

  readonly pageChange = output<number>();

  onPrevious(): void {
    this.pageChange.emit(this.currentPage() - 1);
  }

  onNext(): void {
    this.pageChange.emit(this.currentPage() + 1);
  }

  onGoToPage(rawValue: string): void {
    const parsed = Number(rawValue);
    if (!rawValue || !Number.isInteger(parsed)) return;

    const clamped = Math.min(Math.max(parsed, 1), this.totalPages());
    this.pageChange.emit(clamped);
  }
}
