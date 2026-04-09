import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hasAuth = request.cookies.has('auth_session');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');
  
  // Allow API routes and static files to bypass
  if (request.nextUrl.pathname.startsWith('/api') || request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  if (!hasAuth && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (hasAuth && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};
