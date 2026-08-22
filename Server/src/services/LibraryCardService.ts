import * as LibraryCardDao from '../daos/LibraryCardDao';
import { ILibraryCardWithUser } from '../daos/LibraryCardDao';

import { ILibraryCard } from '../models/LibraryCard';
import { LibraryCardDoesNotExistError } from '../utils/LibraryErrors';

export async function findAllLibraryCards(): Promise<ILibraryCardWithUser[]> {
  return await LibraryCardDao.find();
}

export async function registerLibraryCard(card: ILibraryCard): Promise<ILibraryCardWithUser> {
  try {
    await LibraryCardDao.insert(card);
    const created = await LibraryCardDao.findByUserId(card.user);
    if (created) return created;
    throw new LibraryCardDoesNotExistError('Library Card not found after creation');
  } catch (error: any) {
    // Postgres unique-violation (23505) -> card already exists for this user
    if (error.code === '23505') {
      const existing = await LibraryCardDao.findByUserId(card.user);
      if (existing) return existing;
    }
    throw error;
  }
}

export async function findLibraryCard(libraryCardId: string): Promise<ILibraryCardWithUser> {
  const card = await LibraryCardDao.findById(libraryCardId);
  if (card) return card;
  throw new LibraryCardDoesNotExistError('Library Card not found');
}

export async function findLibraryCardByUserId(userId: string): Promise<ILibraryCardWithUser> {
  const card = await LibraryCardDao.findByUserId(userId);
  if (card) return card;
  throw new LibraryCardDoesNotExistError('Library Card not found');
}
