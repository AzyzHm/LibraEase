import { Request, Response } from 'express';
import {
  findAllRecords,
  generateRecord,
  modifyRecord,
  queryRecords,
  selfCheckout,
  isItemAvailable,
} from '../services/LoanRecordService';
import { LoanRecordDoesNotExistError, BookAlreadyLoanedError } from '../utils/LibraryErrors';
import { getErrorMessage } from '../utils/errors';

async function createRecord(req: Request, res: Response) {
  const record = req.body;

  try {
    const createdRecord = await generateRecord(record);
    res.status(201).json({ message: 'New record generated', record: createdRecord });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
}

async function updateRecord(req: Request, res: Response) {
  const record = req.body;

  try {
    const updatedRecord = await modifyRecord(record);
    res.status(200).json({ message: 'Record updated successfully', record: updatedRecord });
  } catch (error) {
    if (error instanceof LoanRecordDoesNotExistError) {
      res.status(404).json({ message: 'Record does not exist', error });
    } else {
      res.status(500).json({ message: 'Something went wrong', error });
    }
  }
}

async function getAllRecords(req: Request, res: Response) {
  try {
    const records = await findAllRecords();
    res.status(200).json({ message: 'Retrieved all records', records });
  } catch (error) {
    res.status(500).json({ message: 'Unable to retrieve records at this time', error });
  }
}

async function getRecordsByProperty(req: Request, res: Response) {
  const param = req.body as { property: string; value: string | Date };
  const requester = req.user!;

  if (
    requester.type === 'PATRON' &&
    (param.property !== 'patron' || String(param.value) !== requester.id)
  ) {
    res.status(403).json({ message: 'You can only query your own loan records' });
    return;
  }

  try {
    const records = await queryRecords(param);
    res.status(200).json({ message: 'Retrieved records from your query', records });
  } catch (error) {
    res.status(500).json({ message: 'Unable to retrieve records at this time', error });
  }
}

async function createSelfCheckout(req: Request, res: Response) {
  const requester = req.user!;
  const { item, dueDate } = req.body as { item: string; dueDate: Date };

  try {
    const record = await selfCheckout(requester.id, item, dueDate);
    res.status(201).json({ message: 'Book checked out successfully', record });
  } catch (error: unknown) {
    if (error instanceof BookAlreadyLoanedError) {
      res.status(409).json({ message: error.message, error: error.message });
    } else {
      res
        .status(500)
        .json({ message: 'Unable to check out this book', error: getErrorMessage(error) });
    }
  }
}

async function getItemAvailability(req: Request, res: Response) {
  const { itemId } = req.params as { itemId: string };

  try {
    const available = await isItemAvailable(itemId);
    res.status(200).json({ message: 'Availability checked', available });
  } catch (error: unknown) {
    res
      .status(500)
      .json({ message: 'Unable to check availability at this time', error: getErrorMessage(error) });
  }
}

export default {
  createRecord,
  updateRecord,
  getAllRecords,
  getRecordsByProperty,
  createSelfCheckout,
  getItemAvailability,
};