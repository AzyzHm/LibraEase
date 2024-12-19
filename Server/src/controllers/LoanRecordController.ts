import { Request, Response } from 'express';
import { findAllRecords, generateRecord, modifyRecord, queryRecords } from '../services/LoanRecordService';
import { LoanRecordDoesNotExistError } from '../utils/LibraryErrors';

async function createRecord(req: Request, res: Response) {
    let record = req.body;

    try {
        let createdRecord = await generateRecord(record);
        res.status(201).json({ message: "New record generated", record: createdRecord });
    } catch (error) {
        res.status(500).json({ message: "Something went wrong", error });
    }
}

async function updateRecord(req: Request, res: Response) {
    let record = req.body;

    try {
        let updatedRecord = await modifyRecord(record);
        res.status(200).json({ message: "Record updated successfully", record: updatedRecord });
    } catch (error) {
        if (error instanceof LoanRecordDoesNotExistError) {
            res.status(404).json({ message: "Record does not exist", error });
        } else {
            res.status(500).json({ message: "Something went wrong", error });
        }
    }
}

async function getAllRecords(req: Request, res: Response) {
    try {
        let records = await findAllRecords();
        res.status(200).json({ message: "Retrieved all records", records });
    } catch (error) {
        res.status(500).json({ message: "Unable to retrieve records at this time", error });
    }
}

async function getRecordsByProperty(req: Request, res: Response) {
    let param = req.body;

    try {
        let records = await queryRecords(param);
        res.status(200).json({ message: 'Retrieved records from your query', records });
    } catch (error) {
        res.status(500).json({ message: 'Unable to retrieve records at this time', error });
    }
}

export default { createRecord, updateRecord, getAllRecords, getRecordsByProperty };
