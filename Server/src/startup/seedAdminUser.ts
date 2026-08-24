import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { config } from '../config';
import * as UserDao from '../daos/UserDao';

const CREDENTIALS_FILE = path.resolve(__dirname, '../../.seed-admin-credentials.txt');

export async function seedInitialAdmin(): Promise<void> {
  const existingUsers = await UserDao.find();
  const adminAlreadyExists = existingUsers.some((user) => user.type === 'ADMIN');
  if (adminAlreadyExists) return;

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
    status: 'APPROVED',
  });

  console.log('============================================================');
  console.log('No users found in the database - created a default admin account:');
  console.log(`  Email: ${email}`);

  if (passwordWasGenerated) {
    fs.writeFileSync(CREDENTIALS_FILE, `email=${email}\npassword=${password}\n`, { mode: 0o600 });
    console.log(`  Password: a one-time password was generated and saved to:`);
    console.log(`    ${CREDENTIALS_FILE}`);
    console.log('  Read it, log in, then delete that file. Set SEED_ADMIN_PASSWORD in your');
    console.log('  .env instead to pin a known password and skip this step next time.');
  } else {
    console.log('  Password: using the value configured in SEED_ADMIN_PASSWORD.');
  }
  console.log('============================================================');
}
