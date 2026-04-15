import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../lib/supabase';

async function validateAdminSession(): Promise<boolean> {
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
}

export async function GET(req: NextRequest) {
    const isValid = await validateAdminSession();
    if (!isValid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
        .from('game_durations')
        .select(`
            id,
            duration_minutes,
            price_per_player,
            game_types (
                display_name_en
            )
        `)
        .order('duration_minutes', { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const formatted = (data || []).map(d => ({
        id: d.id,
        gameName: (d.game_types as any)?.display_name_en || 'Unknown',
        duration_minutes: d.duration_minutes,
        price_per_player: d.price_per_player
    }));

    return NextResponse.json(formatted);
}
