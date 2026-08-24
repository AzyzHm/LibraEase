import { createClient, PostgrestError } from '@supabase/supabase-js';
import { config } from './index';

if (!config.supabase.url || !config.supabase.serviceKey) {
  console.warn('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing from your environment.');
}

export const supabase = createClient(config.supabase.url, config.supabase.serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export async function unwrap<T>(
  promise: PromiseLike<{ data: T | null; error: PostgrestError | null }>,
): Promise<T | null> {
  const { data, error } = await promise;
  if (error) throw error;
  return data;
}