import express from 'express';
import LibraryCardController from '../controllers/LibraryCardController';
import { Schemas, ValidateSchema } from '../middlewares/Validation';
import { authenticate, authorize } from '../middlewares/Auth';
const router = express.Router();

router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'EMPLOYEE'),
  LibraryCardController.getAllLibraryCards,
);
router.get('/me', authenticate, LibraryCardController.getMyLibraryCard);
router.get(
  '/:cardId',
  authenticate,
  ValidateSchema(Schemas.libraryCard.get, 'params'),
  LibraryCardController.getLibraryCard,
);
router.post(
  '/',
  authenticate,
  ValidateSchema(Schemas.libraryCard.create, 'body'),
  LibraryCardController.createLibraryCard,
);

export = router;
