import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const middleware = createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

export default function(req: NextRequest) {
  // Admin route protection
  const isAdminRoute = req.nextUrl.pathname.match(/^\/(ar|en)\/admin/);
  const isLoginRoute = req.nextUrl.pathname.match(/^\/(ar|en)\/admin\/login/);

  if (isAdminRoute && !isLoginRoute) {
    const isAdmin = req.cookies.get('admin_session')?.value === 'true'; // Placeholder for actual auth check
    if (!isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = `/${req.nextUrl.pathname.split('/')[1]}/admin/login`;
      return NextResponse.redirect(url);
    }
  }

  return middleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
