import Joi,{ObjectSchema} from 'joi';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { IUserModel } from '../daos/UserDao';
import { IBook } from '../models/Book';
import { IBookModel } from '../daos/BookDao';
import { ILibraryCard } from '../models/LibraryCard';
import { ILoanRecord } from '../models/LoanRecord';
import { ILoanRecordModel } from '../daos/LoanRecordDao';

export function ValidateSchema(schema:ObjectSchema, property:string){
    return async function(req:Request,res:Response,next:NextFunction){
        try {
            switch(property){
                case 'query':
                    await schema.validateAsync(req.query);
                    break;
                case 'params':
                    await schema.validateAsync(req.params);
                    break;
                default:
                    await schema.validateAsync(req.body);
            }
            next();
        } catch (error:any) {
            res.status(422).json({ message: "Object Validation failed, please include a valid object"});
        }
    }
}

export const Schemas = {
    user : {
    create: Joi.object<IUser>({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().regex(/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/).required(),
    password: Joi.string().required(),
    type: Joi.string().valid('ADMIN','PATRON','EMPLOYEE').required()
    }),
    login: Joi.object<{email:string,password:string}>({
        email: Joi.string().email().regex(/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/).required(),
        password: Joi.string().required()
    }),
    userId: Joi.object<{userId:string}>({
        userId: Joi.string().guid({ version: 'uuidv4' }).required()
    }),
    update : Joi.object<IUserModel>({
        id : Joi.string().guid({ version: 'uuidv4' }).required(),
        type: Joi.string().valid('ADMIN','PATRON','EMPLOYEE').required(),
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        email: Joi.string().email().regex(/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/).required(),
        password: Joi.string().optional()
    })},
    book : {
        create: Joi.object<IBook>({
            barcode : Joi.string().regex(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/).required(),
            cover : Joi.string().required(),
            title : Joi.string().required(),
            authors : Joi.array().required(),
            description : Joi.string().required(),
            subjects : Joi.array().required(),
            publicationDate : Joi.date().required(),
            publisher : Joi.string().required(),
            pages : Joi.number().required(),
            genre : Joi.string().required()
        }),
        update: Joi.object<IBookModel>({
            id: Joi.string().guid({ version: 'uuidv4' }).required(),
            barcode : Joi.string().regex(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/).required(),
            cover : Joi.string().required(),
            title : Joi.string().required(),
            authors : Joi.array().required(),
            description : Joi.string().required(),
            subjects : Joi.array().required(),
            publicationDate : Joi.date().required(),
            publisher : Joi.string().required(),
            pages : Joi.number().required(),
            genre : Joi.string().required()
        }),
        delete: Joi.object<{barcode:string}>({
            barcode: Joi.string().regex(/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/).required()
        })
    },
    libraryCard: {
        create: Joi.object<ILibraryCard>({
            user: Joi.string().guid({ version: 'uuidv4' }).required()
        }),
        get: Joi.object<{cardId:string}>({
            cardId: Joi.string().guid({ version: 'uuidv4' }).required()
        })
    },
    loan: {
        create: Joi.object<ILoanRecord>({
            status: Joi.string().valid('AVAILABLE','LOANED').required(),
            loanedDate: Joi.date().required(),
            dueDate: Joi.date().required(),
            returnedDate: Joi.date(),
            patron: Joi.string().guid({ version: 'uuidv4' }).required(),
            employeeOut: Joi.string().guid({ version: 'uuidv4' }).required(),
            employeeIn: Joi.string().guid({ version: 'uuidv4' }),
            item: Joi.string().guid({ version: 'uuidv4' }).required()
        }),
        update: Joi.object<ILoanRecordModel>({
            id: Joi.string().guid({ version: 'uuidv4' }).required(),
            status: Joi.string().valid('AVAILABLE','LOANED').required(),
            loanedDate: Joi.date().required(),
            dueDate: Joi.date().required(),
            returnedDate: Joi.date(),
            patron: Joi.string().guid({ version: 'uuidv4' }).required(),
            employeeOut: Joi.string().guid({ version: 'uuidv4' }).required(),
            employeeIn: Joi.string().guid({ version: 'uuidv4' }),
            item: Joi.string().guid({ version: 'uuidv4' }).required()
        }),
        query: Joi.object<{property:string,value:string|Date}>({
            property: Joi.string().valid('id','status','loanedDate','dueDate','returnedDate','patron','employeeOut','employeeIn','item').required(),
            value: Joi.alternatives(Joi.string(),Joi.date()).required()
        })
    }
};