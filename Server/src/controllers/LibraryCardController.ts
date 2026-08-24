import { Request, Response } from 'express';
import {
  registerLibraryCard,
  findLibraryCard,
  findAllLibraryCards,
  findLibraryCardByUserId,
} from '../services/LibraryCardService';
import { findUserById } from '../services/UserService';

import { ILibraryCard } from '../models/LibraryCard';
import { ILibraryCardWithUser } from '../daos/LibraryCardDao';
import { LibraryCardDoesNotExistError } from '../utils/LibraryErrors';
import { getErrorMessage } from '../utils/errors';

type SafeLibraryCard = Omit<ILibraryCardWithUser, 'userDetails'> & {
  userDetails: Omit<ILibraryCardWithUser['userDetails'], 'password'>;
};

function sanitizeCard(card: ILibraryCardWithUser): SafeLibraryCard | ILibraryCardWithUser {
  if (!card) return card;
  const { password: _password, ...safeUserDetails } = card.userDetails;
  return { ...card, userDetails: safeUserDetails };
}

async function getAllLibraryCards(req: Request, res: Response) {
  try {
    const cards = await findAllLibraryCards();
    res
      .status(200)
      .json({
        message: 'Retrieved all library cards',
        count: cards.length,
        cards: cards.map(sanitizeCard),
      });
  } catch (error: unknown) {
    res
      .status(500)
      .json({ message: 'Failed to retrieve library cards', error: getErrorMessage(error) });
  }
}

async function getLibraryCard(req: Request, res: Response) {
  const { cardId } = req.params as { cardId: string };
  const requester = req.user!;

  try {
    const card = await findLibraryCard(cardId);

    if (
      requester.type !== 'ADMIN' &&
      requester.type !== 'EMPLOYEE' &&
      requester.id !== card.userDetails.id
    ) {
      res.status(403).json({ message: 'You can only view your own library card' });
      return;
    }

    res.status(200).json({ message: 'Library Card found', card: sanitizeCard(card) });
  } catch (error: unknown) {
    if (error instanceof LibraryCardDoesNotExistError) {
      res.status(404).json({ message: 'Library Card not found', error: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to get library card', error: getErrorMessage(error) });
  }
}

async function createLibraryCard(req: Request, res: Response) {
  const card: ILibraryCard = req.body;
  const requester = req.user!;

  if (requester.type !== 'ADMIN' && requester.type !== 'EMPLOYEE' && requester.id !== card.user) {
    res.status(403).json({ message: 'You can only request a library card for your own account' });
    return;
  }

  try {
    const targetUser = await findUserById(card.user);
    if (targetUser && targetUser.type === 'ADMIN') {
      res.status(400).json({ message: 'The admin account does not need a library card' });
      return;
    }

    const savedCard = await registerLibraryCard(card);
    res
      .status(201)
      .json({ message: 'Library Card Generated Successfuly', savedCard: sanitizeCard(savedCard) });
  } catch (error: unknown) {
    res
      .status(500)
      .json({ message: 'Failed to generate library card', error: getErrorMessage(error) });
  }
}

async function getMyLibraryCard(req: Request, res: Response) {
  const requester = req.user!; // guaranteed by the `authenticate` middleware on this route

  try {
    const card = await findLibraryCardByUserId(requester.id);
    res.status(200).json({ message: 'Library Card found', card: sanitizeCard(card) });
  } catch (error: unknown) {
    if (error instanceof LibraryCardDoesNotExistError) {
      res
        .status(404)
        .json({
          message: "You don't have a library card yet - ask an admin or employee to issue you one.",
          error: error.message,
        });
      return;
    }
    res.status(500).json({ message: 'Failed to get library card', error: getErrorMessage(error) });
  }
}

export default { getAllLibraryCards, getLibraryCard, createLibraryCard, getMyLibraryCard };