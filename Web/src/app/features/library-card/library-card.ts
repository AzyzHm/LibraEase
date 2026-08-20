import { Component, OnInit, inject } from '@angular/core';
import { AuthStore } from '../../core/state/auth-store';
import { MyLibraryCardStore } from '../../core/state/my-library-card-store';
import { LoadingState } from '../../shared/ui/loading-state/loading-state';
import { EmptyState } from '../../shared/ui/empty-state/empty-state';
import { ErrorState } from '../../shared/ui/error-state/error-state';

@Component({
  selector: 'app-library-card',
  standalone: true,
  imports: [LoadingState, EmptyState, ErrorState],
  templateUrl: './library-card.html',
  styleUrl: './library-card.css'
})
export class LibraryCardPage implements OnInit {
  readonly authStore = inject(AuthStore);
  readonly store = inject(MyLibraryCardStore);

  ngOnInit(): void {
    this.store.load();
  }

  onRetry(): void {
    this.store.load();
  }

  onPrint(): void {
    window.print();
  }
}