export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

async function validateAdminSession(
  request: NextRequest
): Promise<boolean> {
  const token = request.cookies.get('wa_admin_session')?.value;
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('session_token', token)
    .single();
  if (!data) return false;
  return new Date(data.expires_at) > new Date();
}

function generateBookingCode(
  date: string, 
  slotTime: string
): string {
  const [year, month, day] = date.split('-');
  const hour = slotTime.split(':')[0];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from({ length: 2 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return 'WA-' + month + day + '-' + hour + '-' + rand;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60);
  const newM = total % 60;
  return String(newH).padStart(2, '0') + ':' + 
    String(newM).padStart(2, '0');
}

export async function POST(request: NextRequest) {
  try {
    const isValid = await validateAdminSession(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { durationId, date, slotTime, numPlayers,
      customerName, customerPhone, customerEmail } = body;

    if (!durationId || !date || !slotTime || 
        !numPlayers || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const { data: duration, error: durErr } = 
      await supabaseAdmin
        .from('game_durations')
        .select(`
          id, 
          game_type_id, 
          duration_minutes, 
          price_per_player
        `)
        .eq('id', durationId)
        .single();

    if (durErr || !duration) {
      return NextResponse.json(
        { error: 'Invalid duration ID' }, 
        { status: 400 }
      );
    }

    const slotEndTime = addMinutes(slotTime, duration.duration_minutes);

    // Conflict Check 1: Confirmed Bookings
    const { data: conflicts, error: conflictErr } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('booking_date', date)
      .eq('status', 'confirmed')
      .lt('slot_time', slotEndTime)
      .gt('slot_end_time', slotTime);

    if (conflictErr) throw conflictErr;
    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Another booking exists in this time range.' },
        { status: 409 }
      );
    }

    // Conflict Check 2: Manual Blocks
    const { data: blocks, error: blockErr } = await supabaseAdmin
      .from('manual_blocks')
      .select('id')
      .eq('block_date', date)
      .lt('start_time', slotEndTime)
      .gt('end_time', slotTime);

    if (blockErr) throw blockErr;
    if (blocks && blocks.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. A manual block exists in this time range.' },
        { status: 409 }
      );
    }

    const totalPrice = duration.price_per_player * numPlayers;
    const bookingCode = generateBookingCode(date, slotTime);

    const { data: booking, error: bookErr } = 
      await supabaseAdmin
        .from('bookings')
        .insert({
          booking_code: bookingCode,
          game_type_id: duration.game_type_id,
          duration_id: durationId,
          booking_date: date,
          slot_time: slotTime,
          slot_end_time: slotEndTime,
          num_players: numPlayers,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail || 'N/A',
          total_price: totalPrice,
          status: 'confirmed',
        })
        .select()
        .single();

    if (bookErr) {
      console.error('[ManualBooking] Insert error:', 
        bookErr.message);
      return NextResponse.json(
        { error: bookErr.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      booking,
      bookingCode 
    }, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? 
      err.message : 'Server error';
    console.error('[ManualBooking] Error:', msg);
    return NextResponse.json(
      { error: msg }, 
      { status: 500 }
    );
  }
}
