import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware pro kontrolu přístupu.
 * Pokud uživatel nemá v cookies platný 'warehouse_auth', přesměruje ho na login.
 */
export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('warehouse_auth')
  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!authCookie && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (authCookie && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}