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

const barcodeSchema = Joi.string().custom((value: string, helpers) => {
    const stripped = value.replace(/-/g, '');
    const isIsbn10 = /^\d{9}[\dXx]$/.test(stripped);
    const isIsbn13 = /^\d{13}$/.test(stripped);
    if (!isIsbn10 && !isIsbn13) {
        return helpers.error('any.invalid');
    }
    return value;
}, 'ISBN-10 or ISBN-13 barcode').required();

export const Schemas = {
    user : {
    create: Joi.object<IUser>({
    firstname: Joi.string().required(),
    lastname: Joi.string().required(),
    email: Joi.string().email().regex(/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/).required(),
    password: Joi.string().required(),
    type: Joi.string().valid('ADMIN','PATRON','EMPLOYEE').optional()
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
            barcode : barcodeSchema,
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
            barcode : barcodeSchema,
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
            barcode: barcodeSchema
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
            returnedDate: Joi.date().allow(null),
            patron: Joi.string().guid({ version: 'uuidv4' }).required(),
            employeeOut: Joi.string().guid({ version: 'uuidv4' }).allow(null).required(),
            employeeIn: Joi.string().guid({ version: 'uuidv4' }).allow(null),
            item: Joi.string().guid({ version: 'uuidv4' }).required()
        }),
        query: Joi.object<{property:string,value:string|Date}>({
            property: Joi.string().valid('id','status','loanedDate','dueDate','returnedDate','patron','employeeOut','employeeIn','item').required(),
            value: Joi.alternatives(Joi.string(),Joi.date()).required()
        }),
        selfCheckout: Joi.object<{item:string,dueDate:Date}>({
            item: Joi.string().guid({ version: 'uuidv4' }).required(),
            dueDate: Joi.date().greater('now').required()
        }),
        itemId: Joi.object<{itemId:string}>({
            itemId: Joi.string().guid({ version: 'uuidv4' }).required()
        })
    }
};