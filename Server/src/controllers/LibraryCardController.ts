import {Request, Response} from "express";
import { registerLibraryCard, findLibraryCard, findAllLibraryCards } from "../services/LibraryCardService";

import { ILibraryCard } from "../models/LibraryCard";
import { ILibraryCardWithUser } from "../daos/LibraryCardDao";
import { LibraryCardDoesNotExistError } from "../utils/LibraryErrors";

function sanitizeCard(card: ILibraryCardWithUser): any {
    if (!card) return card;
    const { password, ...safeUserDetails } = card.userDetails as any;
    return { ...card, userDetails: safeUserDetails };
}

async function getAllLibraryCards(req:Request, res:Response){
    // Role check (ADMIN/EMPLOYEE only) happens in the route via `authorize`.
    try {
        const cards = await findAllLibraryCards();
        res.status(200).json({message : "Retrieved all library cards", count: cards.length, cards: cards.map(sanitizeCard)});
    } catch (error:any) {
        res.status(500).json({message : "Failed to retrieve library cards", error:error.message});
    }
}

async function getLibraryCard(req:Request, res:Response){
    const {cardId} = req.params as { cardId: string };
    const requester = req.user!; // guaranteed by the `authenticate` middleware on this route

    try {
        let card = await findLibraryCard(cardId);

        if (requester.type !== 'ADMIN' && requester.type !== 'EMPLOYEE' && requester.id !== card.userDetails.id) {
            res.status(403).json({message : "You can only view your own library card"});
            return;
        }

        res.status(200).json({message : "Library Card found", card: sanitizeCard(card)});
    } catch (error:any) {
        if(error instanceof LibraryCardDoesNotExistError){
            res.status(404).json({message : "Library Card not found", error:error.message});
            return;
        }
        res.status(500).json({message : "Failed to get library card", error:error.message});
    }
}

async function createLibraryCard(req:Request, res:Response){
    const card:ILibraryCard = req.body;
    const requester = req.user!; // guaranteed by the `authenticate` middleware on this route

    if (requester.type !== 'ADMIN' && requester.type !== 'EMPLOYEE' && requester.id !== card.user) {
        res.status(403).json({message : "You can only request a library card for your own account"});
        return;
    }

    try {
        let savedCard = await registerLibraryCard(card);
        res.status(201).json({message : "Library Card Generated Successfuly", savedCard: sanitizeCard(savedCard)});
    } catch (error:any) {
        res.status(500).json({message : "Failed to generate library card", error:error.message});
    }
}

export default {getAllLibraryCards, getLibraryCard, createLibraryCard};