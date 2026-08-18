import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config';
import * as UserDao from '../daos/UserDao';


export async function seedInitialAdmin(): Promise<void> {
    const existingUsers = await UserDao.find();
    if (existingUsers.length > 0) return;

    const email = process.env.SEED_ADMIN_EMAIL || 'admin@libraease.local';
    const firstname = process.env.SEED_ADMIN_FIRSTNAME || 'Library';
    const lastname = process.env.SEED_ADMIN_LASTNAME || 'Admin';

    const passwordWasGenerated = !process.env.SEED_ADMIN_PASSWORD;
    const password = process.env.SEED_ADMIN_PASSWORD || crypto.randomBytes(9).toString('base64url');

    const hashedPassword = await bcrypt.hash(password, config.server.rounds);

    await UserDao.insert({
        type: 'ADMIN',
        firstname,
        lastname,
        email,
        password: hashedPassword,
        status: 'APPROVED'
    });

    console.log('============================================================');
    console.log('No users found in the database - created a default admin account:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    if (passwordWasGenerated) {
        console.log('(This password was randomly generated because SEED_ADMIN_PASSWORD');
        console.log(' was not set. Set it in your .env to pin a known password instead.)');
    }
    console.log('============================================================');
}