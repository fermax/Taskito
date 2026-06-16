import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !url.startsWith('http')) {
    console.error('Supabase URL is missing or invalid. Please check your .env.local file.');
    // Return a dummy client or handle error to prevent crash
    return {} as any;
  }

  // Detect if rememberMe is enabled
  let rememberMe = false;
  if (typeof window !== 'undefined') {
    rememberMe = document.cookie.split('; ').some(row => row.trim().startsWith('taskito_remember_me=true'));
  }

  return createBrowserClient(url, key!, {
    cookies: {
      get(name: string) {
        if (typeof window === 'undefined') return undefined;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return undefined;
      },
      set(name: string, value: string, options: any) {
        if (typeof window === 'undefined') return;
        const cookieOptions = { ...options };
        if (!rememberMe) {
          delete cookieOptions.maxAge;
          delete cookieOptions.expires;
        }
        let cookieStr = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${cookieOptions.path || '/'}`;
        if (cookieOptions.maxAge !== undefined) {
          cookieStr += `; max-age=${cookieOptions.maxAge}`;
        }
        if (cookieOptions.domain) {
          cookieStr += `; domain=${cookieOptions.domain}`;
        }
        if (cookieOptions.secure) {
          cookieStr += '; secure';
        }
        if (cookieOptions.sameSite) {
          cookieStr += `; samesite=${cookieOptions.sameSite}`;
        }
        document.cookie = cookieStr;
      },
      remove(name: string, options: any) {
        if (typeof window === 'undefined') return;
        document.cookie = `${encodeURIComponent(name)}=; path=${options?.path || '/'}; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
      }
    }
  });
}

