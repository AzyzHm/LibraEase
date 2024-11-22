import Joi,{ObjectSchema} from 'joi';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

export function ValidateSchema(schema:ObjectSchema){
    return async function(req:Request,res:Response,next:NextFunction){
        try {
            await schema.validateAsync(req.body);
            next();
        } catch (error:any) {
            console.error('Validation Error:', error.details);
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
    })
}
};