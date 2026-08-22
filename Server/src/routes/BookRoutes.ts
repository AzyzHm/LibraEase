import express from 'express';
import BookController from '../controllers/BookController';
import { Schemas, ValidateSchema } from '../middlewares/Validation';
import { authenticate, authorize } from '../middlewares/Auth';

const router = express.Router();

router.get('/', BookController.getAllBooks);
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'EMPLOYEE'),
  ValidateSchema(Schemas.book.create, 'body'),
  BookController.createBook,
);
router.put(
  '/',
  authenticate,
  authorize('ADMIN', 'EMPLOYEE'),
  ValidateSchema(Schemas.book.update, 'body'),
  BookController.updateBook,
);
router.delete(
  '/:barcode',
  authenticate,
  authorize('ADMIN', 'EMPLOYEE'),
  ValidateSchema(Schemas.book.delete, 'params'),
  BookController.deleteBook,
);
router.get('/query', BookController.searchForBooksByQuery);

export = router;
