import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStore } from '../../state/auth-store';
import { EditProfileModal } from '../../../shared/ui/edit-profile-modal/edit-profile-modal';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, EditProfileModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar {
  private readonly router = inject(Router);
  protected readonly authStore = inject(AuthStore);

  /** Whether the collapsed (mobile, <md) menu is expanded. */
  readonly menuOpen = signal(false);

  /** Whether the edit-profile modal is open. */
  readonly editProfileOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  openEditProfile(): void {
    this.closeMenu();
    this.editProfileOpen.set(true);
  }

  closeEditProfile(): void {
    this.editProfileOpen.set(false);
  }

  onSignOut(): void {
    this.closeMenu();
    this.authStore.logout();
    this.router.navigateByUrl('/');
  }
}