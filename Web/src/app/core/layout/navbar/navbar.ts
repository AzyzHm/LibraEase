import {
  Component,
  ElementRef,
  PLATFORM_ID,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { animate } from 'motion';
import { AuthStore } from '../../state/auth-store';
import { EditProfileModal } from '../../../shared/ui/edit-profile-modal/edit-profile-modal';
import { springStandard } from '../../../shared/motion/springs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, EditProfileModal],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly authStore = inject(AuthStore);

  readonly menuOpen = signal(false);

  readonly editProfileOpen = signal(false);

  private readonly mobileNav = viewChild<ElementRef<HTMLElement>>('mobileNav');

  constructor() {
    effect(() => {
      const nav = this.mobileNav()?.nativeElement;
      if (!nav || !isPlatformBrowser(this.platformId)) {
        return;
      }

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      animate(
        nav,
        { opacity: [0, 1], transform: ['translateY(-8px)', 'translateY(0)'] },
        reducedMotion ? { duration: 0.001 } : springStandard,
      );
    });
  }

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
    this.router.navigateByUrl('/login');
  }
}
