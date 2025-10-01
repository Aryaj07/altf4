import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  const pathname = req.nextUrl.pathname;
  
  const isProtectedRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/order-confirmation') ||
    pathname.startsWith('/checkout');

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/order-confirmation/:path*', 
    '/checkout/:path*'
  ],
};