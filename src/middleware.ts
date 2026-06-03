import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const secret = () => new TextEncoder().encode(process.env['JWT_SECRET'])

const PROTECTED_API = ['/api/links', '/api/stripe/checkout', '/api/stripe/portal', '/api/user']
const PROTECTED_PAGES = ['/dashboard']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Webhook must never be gated
  if (pathname === '/api/stripe/webhook') return NextResponse.next()

  const needsAuth =
    PROTECTED_PAGES.some((p) => pathname.startsWith(p)) ||
    PROTECTED_API.some((p) => pathname.startsWith(p))

  if (!needsAuth) return NextResponse.next()

  const token = req.cookies.get('devlinks_token')?.value

  if (!token) {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    await jwtVerify(token, secret())
    return NextResponse.next()
  } catch {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/links/:path*', '/api/stripe/:path*', '/api/user/:path*'],
}
