import express,{Express, Request, Response} from 'express';
import cors from 'cors';
import {config} from './config';
import {registerRoutes} from './routes';

const port = config.server.port;

const app: Express = express();
app.use(express.json());
app.use(cors());

registerRoutes(app);

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
