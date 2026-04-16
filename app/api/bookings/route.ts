import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function sanitize(input: string): string {
  return input ? input.replace(/<[^>]*>?/gm, "") : "";
}

function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [h, m] = startTime.split(":").map(Number);
  const totalMinutes = h * 60 + m + durationMinutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

function generateBookingCode(date: string, slotTime: string): string {
  const [, month, day] = date.split('-');
  const hour = slotTime.split(':')[0];
  const rand = Array.from({ length: 2 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return 'WA-' + month + day + '-' + hour + '-' + rand;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { 
        durationId, 
        date, 
        slotTime, 
        numPlayers, 
        customerName, 
        customerPhone, 
        customerEmail 
    } = body;

    customerName = sanitize(customerName);
    customerPhone = sanitize(customerPhone);
    customerEmail = sanitize(customerEmail);
    date = sanitize(date);
    slotTime = sanitize(slotTime);

    if (!durationId || !date || !slotTime || !numPlayers || !customerName || !customerPhone) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Restore Egyptian Phone Validation
    const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
    if (!egyptianPhoneRegex.test(customerPhone)) {
      return NextResponse.json(
        { error: 'Invalid Egyptian phone number format. Must start with 010, 011, 012, or 015 followed by 8 digits.' },
        { status: 400 }
      );
    }

    const { data: duration, error: durError } = await supabaseAdmin
      .from("game_durations")
      .select("id, game_type_id, duration_minutes, price_per_player")
      .eq("id", durationId)
      .single();

    if (durError || !duration) {
      return NextResponse.json({ error: "Invalid duration ID" }, { status: 400 });
    }

    const slotEndTime = calculateEndTime(slotTime, duration.duration_minutes);
    const totalPrice = duration.price_per_player * numPlayers;

    // Explicit overlap conflict check
    const { data: conflicts } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('booking_date', date)
      .eq('status', 'confirmed')
      .lt('slot_time', slotEndTime + ':00')
      .gt('slot_end_time', slotTime + ':00');

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please choose another slot.' },
        { status: 409 }
      );
    }
    
    // Generate Booking Code with Collision Protection
    let bookingCode = generateBookingCode(date, slotTime);
    
    const { data: existing } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('booking_code', bookingCode)
      .single();

    if (existing) {
      bookingCode = bookingCode + chars[Math.floor(Math.random() * chars.length)];
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
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
        customer_email: customerEmail,
        total_price: totalPrice,
        status: "confirmed"
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mappedResult = {
        gameTypeId: data.game_type_id,
        durationId: data.duration_id,
        date: data.booking_date,
        slotTime: data.slot_time.substring(0, 5),
        slotEndTime: data.slot_end_time.substring(0, 5),
        numPlayers: data.num_players,
        totalPrice: data.total_price,
        customerName: data.customer_name,
        customerPhone: data.customer_phone,
        customerEmail: data.customer_email,
        bookingCode: data.booking_code
    };

    return NextResponse.json(mappedResult, { status: 201 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
