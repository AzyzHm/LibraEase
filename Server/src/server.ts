import express,{Express} from 'express';
import cors from 'cors';
import {config} from './config';
import {registerRoutes} from './routes';
import {seedInitialAdmin} from './startup/seedAdminUser';

const port = config.server.port;

const app: Express = express();

app.use(express.json());

const allowedOrigins = [
    'http://localhost:5173'
];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Origin not allowed'));
            }
        }
    })
);

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
