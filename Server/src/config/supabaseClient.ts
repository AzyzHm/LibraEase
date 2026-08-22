import { createClient } from '@supabase/supabase-js';
import { config } from './index';

if (!config.supabase.url || !config.supabase.serviceKey) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from your environment.');
}

// Server-side client: uses the service role key, so it bypasses Row Level
// Security. That's intentional here — auth/authorization is handled by
// this Express app, not by Supabase RLS policies.
export const supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Small helper so call sites can keep the "throw on failure" style the
// codebase already used with Mongoose, instead of checking {data,error}
// everywhere by hand.
export async function unwrap<T>(
  promise: PromiseLike<{ data: T | null; error: any }>,
): Promise<T | null> {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}
