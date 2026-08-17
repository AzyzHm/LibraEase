import express from 'express';
import LoanRecordController from '../controllers/LoanRecordController';
import { ValidateSchema,Schemas } from '../middlewares/Validation';
import { authenticate, authorize } from '../middlewares/Auth';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN','EMPLOYEE'), LoanRecordController.getAllRecords);
router.post('/', authenticate, authorize('ADMIN','EMPLOYEE'), ValidateSchema(Schemas.loan.create,'body') ,LoanRecordController.createRecord);
router.put('/', authenticate, authorize('ADMIN','EMPLOYEE'), ValidateSchema(Schemas.loan.update,'body'),LoanRecordController.updateRecord);
router.post('/query', authenticate, ValidateSchema(Schemas.loan.query, 'body'),LoanRecordController.getRecordsByProperty);

export = router;