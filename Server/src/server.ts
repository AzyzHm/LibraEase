import { createApp } from './app';
import { config } from './config';
import { seedInitialAdmin } from './startup/seedAdminUser';

const port = config.server.port;
const app = createApp();

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