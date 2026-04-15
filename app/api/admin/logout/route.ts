import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('wa_admin_session')?.value;

  if (token) {
    // Attempt to delete from database
    await supabaseAdmin
      .from('admin_sessions')
      .delete()
      .eq('session_token', token);
  }

  const response = NextResponse.json({ success: true });
  
  // Clear the cookie
  response.cookies.set('wa_admin_session', '', {
    path: '/',
    maxAge: 0,
    expires: new Date(0)
  });

  return response;
}
