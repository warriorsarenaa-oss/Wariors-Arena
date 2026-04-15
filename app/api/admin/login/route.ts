import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '../../../../lib/supabase';

const failedAttempts = new Map<string, { count: number, resetTime: number }>();

function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) {
    // Still perform a comparison to minimize timing information leaks
    crypto.timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  const now = Date.now();
  
  // Rate limiting check
  const record = failedAttempts.get(ip);
  if (record && now < record.resetTime && record.count >= 5) {
    return NextResponse.json({ error: 'Too many failed attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  try {
    const { username, password } = await req.json();

    const expectedUser = process.env.ADMIN_USERNAME || '';
    const expectedPass = process.env.ADMIN_PASSWORD || '';

    const isUserValid = timingSafeCompare(username, expectedUser);
    const isPassValid = timingSafeCompare(password, expectedPass);

    if (isUserValid && isPassValid) {
      // Success - reset rate limit for this IP
      failedAttempts.delete(ip);

      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(now + 8 * 60 * 60 * 1000); // 8 hours

      const { error } = await supabaseAdmin
        .from('admin_sessions')
        .insert({
          session_token: sessionToken,
          expires_at: expiresAt.toISOString()
        });

      if (error) {
        console.error('[AdminLogin] Session insert error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      const response = NextResponse.json({ success: true });
      
      response.cookies.set('wa_admin_session', sessionToken, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 28800 // 8 hours
      });

      return response;
    } else {
      // Failure - update rate limit
      const current = failedAttempts.get(ip) || { count: 0, resetTime: now + 15 * 60 * 1000 };
      if (now > current.resetTime) {
        current.count = 1;
        current.resetTime = now + 15 * 60 * 1000;
      } else {
        current.count++;
      }
      failedAttempts.set(ip, current);

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
