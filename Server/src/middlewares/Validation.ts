import Joi,{ObjectSchema} from 'joi';
import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { IUserModel } from '../daos/UserDao';

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
        userId: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required()
    }),
    update : Joi.object<IUserModel>({
        _id : Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        type: Joi.string().valid('ADMIN','PATRON','EMPLOYEE').required(),
        firstname: Joi.string().required(),
        lastname: Joi.string().required(),
        email: Joi.string().email().regex(/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/).required(),
        password: Joi.string().required()
    })
}
};