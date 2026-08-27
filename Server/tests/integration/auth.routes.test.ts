import request from 'supertest';
import { Request, Response, NextFunction } from 'express';

jest.mock(
  'express-rate-limit',
  () => () => (req: Request, res: Response, next: NextFunction) => next(),
);

import { createApp } from '../../src/app';
import * as UserDao from '../../src/daos/UserDao';
import { IUserModel } from '../../src/daos/UserDao';
import bcrypt from 'bcryptjs';

jest.mock('../../src/daos/UserDao');

const mockedUserDao = UserDao as jest.Mocked<typeof UserDao>;
const app = createApp();

function makeUser(overrides: Partial<IUserModel> = {}): IUserModel {
  return {
    id: 'user-1',
    type: 'PATRON',
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    password: 'hashed-password',
    status: 'APPROVED',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('POST /auth/register', () => {
  const validPayload = {
    firstname: 'Jane',
    lastname: 'Doe',
    email: 'jane@example.com',
    password: 'plain-password',
  };

  it('registers a new PENDING patron and never echoes the password back', async () => {
    mockedUserDao.insert.mockResolvedValue(makeUser({ status: 'PENDING' }));

    const res = await request(app).post('/auth/register').send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.user.status).toBe('PENDING');
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects an invalid payload with 422', async () => {
    const res = await request(app).post('/auth/register').send({ email: 'not-an-email' });

    expect(res.status).toBe(422);
    expect(mockedUserDao.insert).not.toHaveBeenCalled();
  });

  it('returns 409 when the email is already registered', async () => {
    mockedUserDao.insert.mockRejectedValue({ code: '23505', message: 'duplicate key' });

    const res = await request(app).post('/auth/register').send(validPayload);

    expect(res.status).toBe(409);
  });
});

describe('POST /auth/login', () => {
  it('logs in with correct credentials and sets an httpOnly auth cookie', async () => {
    const hashed = await bcrypt.hash('correct-password', 4);
    mockedUserDao.findByEmail.mockResolvedValue(makeUser({ password: hashed, status: 'APPROVED' }));

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'correct-password' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeUndefined();
    expect(res.body.user.email).toBe('jane@example.com');

    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(
      cookies.some((cookie) => cookie.startsWith('auth_token=') && /HttpOnly/i.test(cookie)),
    ).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('csrf_token='))).toBe(true);
  });

  it('returns 401 for an unknown email', async () => {
    mockedUserDao.findByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: 'whatever' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for an incorrect password', async () => {
    const hashed = await bcrypt.hash('correct-password', 4);
    mockedUserDao.findByEmail.mockResolvedValue(makeUser({ password: hashed }));

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('returns 403 when the account is still PENDING approval', async () => {
    const hashed = await bcrypt.hash('correct-password', 4);
    mockedUserDao.findByEmail.mockResolvedValue(makeUser({ password: hashed, status: 'PENDING' }));

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'jane@example.com', password: 'correct-password' });

    expect(res.status).toBe(403);
  });

  it('rejects a payload missing the password field with 422', async () => {
    const res = await request(app).post('/auth/login').send({ email: 'jane@example.com' });

    expect(res.status).toBe(422);
  });
});
