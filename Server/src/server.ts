import express,{Express, Request, Response} from 'express';
import cors from 'cors';
import {config} from './config';
import mongoose from 'mongoose';
import {registerRoutes} from './routes';

const port = config.server.port;

const app: Express = express();
app.use(express.json());
app.use(cors());

(async function startUp(){
    try {
        await mongoose.connect(config.mongo.url, {w: 'majority',retryWrites: true,authMechanism : "DEFAULT"});
        console.log('Connected to database');        

        registerRoutes(app);

        app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Error connecting to database: ', error);
    }
    })();
