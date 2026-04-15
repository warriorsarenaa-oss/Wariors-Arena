import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../lib/supabase';

async function validateAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('wa_admin_session')?.value;
    if (!token) return false;
    
    const { data } = await supabaseAdmin
      .from('admin_sessions')
      .select('id, expires_at')
      .eq('session_token', token)
      .single();
    
    if (!data) return false;
    if (new Date(data.expires_at) < new Date()) return false;
    return true;
  } catch (e) {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    const isValid = await validateAdminSession();
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('id, booking_code, customer_name, created_at')
      .filter('created_at', 'gte', thirtySecondsAgo)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      count: data?.length || 0,
      recent: data || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
