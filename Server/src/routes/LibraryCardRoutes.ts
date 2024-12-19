import express from "express";
import LibraryCardController from "../controllers/LibraryCardController";
import { Schemas,ValidateSchema } from "../middlewares/Validation";
const router = express.Router();

router.get('/:cardId',ValidateSchema(Schemas.libraryCard.get,'params'),LibraryCardController.getLibraryCard);
router.post('/', ValidateSchema(Schemas.libraryCard.create,'body'),LibraryCardController.createLibraryCard);

export = router;