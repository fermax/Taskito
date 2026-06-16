import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const authRateLimit = new Map<string, number[]>()

function checkAuthRateLimit(key: string, maxRequests = 5, windowMs = 60_000): boolean {
  const now = Date.now()
  const timestamps = authRateLimit.get(key) || []
  const valid = timestamps.filter((t) => t > now - windowMs)
  if (valid.length >= maxRequests) return false
  valid.push(now)
  authRateLimit.set(key, valid)
  return true
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const pathname = request.nextUrl.pathname
  const rememberMe = request.cookies.get('taskito_remember_me')?.value === 'true'

  const isAuthRoute = pathname === '/login' || pathname === '/signup' || pathname === '/reset-password'
  if (isAuthRoute) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous'
    if (!checkAuthRateLimit(`${pathname}:${ip}`)) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
    }
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const cookieOptions = { ...options }
          if (!rememberMe) {
            delete cookieOptions.maxAge
            delete cookieOptions.expires
          }
          request.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...cookieOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    if (request.nextUrl.pathname === '/' && rememberMe) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
