process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'https://test-project.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.SERVER_PORT = process.env.SERVER_PORT ?? '8000';
process.env.SERVER_ROUNDS = process.env.SERVER_ROUNDS ?? '4';
