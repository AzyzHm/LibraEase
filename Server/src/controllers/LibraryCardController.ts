import {Request, Response} from "express";
import { registerLibraryCard, findLibraryCard } from "../services/LibraryCardService";

import { ILibraryCard } from "../models/LibraryCard";
import { LibraryCardDoesNotExistError } from "../utils/LibraryErrors";

async function getLibraryCard(req:Request, res:Response){
    const {cardId} = req.params;
    try {
        let card = await findLibraryCard(cardId);
        res.status(200).json({message : "Library Card found", card});
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
    try {
        let savedCard = await registerLibraryCard(card);
        res.status(201).json({message : "Library Card Generated Successfuly", savedCard});
    } catch (error:any) {
        res.status(500).json({message : "Failed to generate library card", error:error.message});
    }
}

export default {getLibraryCard, createLibraryCard};