import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Edge-compatible Supabase client for middleware
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

const intlMiddleware = createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  
  // 1. Identify admin routes
  const isAdminRoute = pathname.match(/^\/(ar|en)\/admin/);
  const isLoginRoute = pathname.match(/^\/(ar|en)\/admin\/login/);

  // 2. Protect admin routes (excluding login page)
  if (isAdminRoute && !isLoginRoute) {
    const sessionToken = req.cookies.get('wa_admin_session')?.value;

    if (!sessionToken) {
      const url = req.nextUrl.clone();
      const locale = pathname.split('/')[1] || 'ar';
      url.pathname = `/${locale}/admin/login`;
      return NextResponse.redirect(url);
    }

    // Verify session in database
    const { data: session, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('expires_at')
      .eq('session_token', sessionToken)
      .single();

    if (error || !session || new Date(session.expires_at) < new Date()) {
      // Invalid or expired session
      const url = req.nextUrl.clone();
      const locale = pathname.split('/')[1] || 'ar';
      url.pathname = `/${locale}/admin/login`;
      
      const response = NextResponse.redirect(url);
      response.cookies.set('wa_admin_session', '', { maxAge: 0 });
      return response;
    }
  }

  // 3. Fallback to i18n middleware
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
