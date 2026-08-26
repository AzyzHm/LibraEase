import dotenv from 'dotenv';

dotenv.config();

const supabase_url: string = process.env.SUPABASE_URL || '';
const supabase_service_key: string = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 8000;

const DEFAULT_ROUNDS = 10;
const ROUNDS: number = process.env.ROUNDS ? parseInt(process.env.ROUNDS) : DEFAULT_ROUNDS;

const DEV_ONLY_JWT_SECRET = 'libraease_dev_only_insecure_secret_do_not_deploy';

function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JWT_SECRET environment variable is required in production, refusing to start with an insecure default',
    );
  }
  console.warn(
    '[config] JWT_SECRET is not set, falling back to an insecure development-only secret. ' +
      'This must never happen in a real deployment.',
  );
  return DEV_ONLY_JWT_SECRET;
}

const jwtSecret: string = resolveJwtSecret();

const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export const config = {
  supabase: {
    url: supabase_url,
    serviceKey: supabase_service_key,
  },
  server: {
    port: PORT,
    rounds: ROUNDS,
  },
  jwtSecret,
  jwtExpiresIn: JWT_EXPIRES_IN,
};