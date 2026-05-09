import { NextRequest, NextResponse } from 'next/server';

const DRIVER_COOKIE = 'driver_session';
const ADMIN_COOKIE = 'admin_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 保护司机端页面：/home/*
  if (pathname.startsWith('/home')) {
    const token = request.cookies.get(DRIVER_COOKIE)?.value;
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 保护管理员端页面：/admin（不含 /admin/login）
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(ADMIN_COOKIE)?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/home/:path*', '/admin/:path*'],
};
