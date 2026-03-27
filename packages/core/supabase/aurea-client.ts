import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set'
  );
}

export function createAureaClient(token: string): SupabaseClient {
  return createClient(supabaseUrl!, supabaseAnonKey!, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function getAureaTokenFromCookies(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)aurea_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function setAureaCookie(token: string): void {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + 1);
  document.cookie = `aurea_token=${encodeURIComponent(token)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

export function clearAureaCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = 'aurea_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
}
