import express from 'express';
import LoanRecordController from '../controllers/LoanRecordController';
import { ValidateSchema,Schemas } from '../middlewares/Validation';

const router = express.Router();

router.get('/',LoanRecordController.getAllRecords);
router.post('/',ValidateSchema(Schemas.loan.create,'body') ,LoanRecordController.createRecord);
router.put('/', ValidateSchema(Schemas.loan.update,'body'),LoanRecordController.updateRecord);
router.post('/query', ValidateSchema(Schemas.loan.query, 'body'),LoanRecordController.getRecordsByProperty);

export = router;