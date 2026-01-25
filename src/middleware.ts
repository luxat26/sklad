import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Zkontrolujeme, jestli má uživatel "razítko" (cookie)
  const isLoggedIn = request.cookies.has('is_logged_in');
  
  const isLoginPage = request.nextUrl.pathname === '/login';

  // 1. Pokud NENÍ přihlášený a snaží se jít jinam než na login -> šup na login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 2. Pokud JE přihlášený a snaží se jít na login -> šup do skladu (ať se nezdržuje)
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Kde všude má vrátný hlídat?
export const config = {
  matcher: [
    /*
     * Hlídáme všechno KROMĚ:
     * - api routes
     * - statických souborů (_next/static, _next/image, favicon.ico)
     * - obrázků (svg, png, jpg...)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};