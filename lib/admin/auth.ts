import { NextRequest } from 'next/server';
import { supabaseAdmin } from '../supabase';

export async function validateAdminSession(req: NextRequest): Promise<boolean> {
  const sessionToken = req.cookies.get('wa_admin_session')?.value;
  
  if (!sessionToken) return false;

  const { data: session, error } = await supabaseAdmin
    .from('admin_sessions')
    .select('expires_at')
    .eq('session_token', sessionToken)
    .single();

  if (error || !session || new Date(session.expires_at) < new Date()) {
    return false;
  }

  return true;
}
