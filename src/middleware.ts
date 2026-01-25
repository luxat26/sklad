import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Debug výpis do terminálu
  const cookie = request.cookies.get('is_logged_in');
  console.log(`[MIDDLEWARE] URL: ${request.nextUrl.pathname} | Cookie found: ${cookie?.value}`);

  const isLoggedIn = !!cookie; // true pokud cookie existuje
  const isLoginPage = request.nextUrl.pathname === '/login';

  // 1. Nemá cookie a není na loginu -> Login
  if (!isLoggedIn && !isLoginPage) {
    console.log("[MIDDLEWARE] -> Redirecting to /login");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Má cookie a je na loginu -> Sklad
  if (isLoggedIn && isLoginPage) {
    console.log("[MIDDLEWARE] -> Redirecting to Dashboard");
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};