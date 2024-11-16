import dotenv from 'dotenv';

dotenv.config();

const mongo_username:string = process.env.MONGO_USERNAME || "";
const mongo_password:string = process.env.MONGO_PASSWORD || "";

const mongo_url:string = `mongodb://${mongo_username}:${mongo_password}@localhost:27017/LibraEase`;

const PORT:number = process.env.SERVER_PORT ? (parseInt(process.env.SERVER_PORT)) : 8000;
const ROUNDS:number = process.env.SERVER_ROUNDS ? (parseInt(process.env.SERVER_ROUNDS)) : Math.floor(Math.random() * 10) + 1;

export const config = {
    mongo : {
        url: mongo_url
    },
    server: {
        port: PORT,
        rounds: ROUNDS
    }
    };