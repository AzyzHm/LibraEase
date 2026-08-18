import { AdminUser } from './admin.model';

export interface LibraryCardWithUser {
  id: string;
  user: string;
  userDetails: AdminUser;
}

/** GET /card response envelope - admin/employee only. */
export interface LibraryCardListResponse {
  message: string;
  count: number;
  cards: LibraryCardWithUser[];
}

/** POST /card response envelope. */
export interface LibraryCardCreateResponse {
  message: string;
  savedCard: LibraryCardWithUser;
}

/** GET /card/:cardId response envelope. */
export interface LibraryCardGetResponse {
  message: string;
  card: LibraryCardWithUser;
}