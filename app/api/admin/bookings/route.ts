import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../lib/supabase';

async function validateAdminSession(request: NextRequest): Promise<boolean> {
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

export async function GET(request: NextRequest) {
  const isValid = await validateAdminSession(request);
  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized' }, { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  try {
    let query = supabaseAdmin
      .from('bookings')
      .select('*, game_types(display_name_en), game_durations(duration_minutes)')
      .order('slot_time', { ascending: true });

    if (date) {
      // Root level fix: fetch all for date, let component filter
      query = query.eq('booking_date', date);
    } else if (from && to) {
      query = query
        .gte('booking_date', from)
        .lte('booking_date', to)
        .eq('status', 'confirmed');
    } else {
      return NextResponse.json(
        { error: 'Provide date or from+to params' },
        { status: 400 }
      );
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message }, { status: 500 }
      );
    }

    if (date) {
      console.log('[Admin Bookings] Date:', date, 'Found:', data?.length, 'bookings');
      console.log('[Admin Bookings] Statuses:', data?.map(b => b.status + ':' + b.slot_time));
    }

    return NextResponse.json({
      bookings: (data || []).map(b => ({
        id: b.id,
        booking_code: b.booking_code,
        booking_date: b.booking_date,
        slot_time: b.slot_time,
        slot_end_time: b.slot_end_time,
        num_players: b.num_players,
        total_price: b.total_price,
        customer_name: b.customer_name,
        customer_phone: b.customer_phone,
        customer_email: b.customer_email,
        status: b.status,
        gameName: b.game_types?.display_name_en || 'Unknown',
        durationMinutes: b.game_durations?.duration_minutes || 30,
      }))
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

