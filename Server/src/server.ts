import express,{Express} from 'express';
import cors from 'cors';
import {config} from './config';
import {registerRoutes} from './routes';
import {seedInitialAdmin} from './startup/seedAdminUser';

const port = config.server.port;

const app: Express = express();
app.use(express.json());
app.use(cors());

registerRoutes(app);

async function start(): Promise<void> {
    try {
        await seedInitialAdmin();
    } catch (error) {
        console.error('Failed to check/seed the initial admin account:', error);
    }

    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });
}

start();