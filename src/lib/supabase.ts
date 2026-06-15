import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !url.startsWith('http')) {
    console.error('Supabase URL is missing or invalid. Please check your .env.local file.');
    // Return a dummy client or handle error to prevent crash
    return {} as any;
  }

  return createBrowserClient(url, key!);
}
