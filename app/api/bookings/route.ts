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

    console.log("[Bookings] Inserting:", { 
        booking_code: bookingCode, 
        slot_time: slotTime, 
        slot_end_time: slotEndTime, 
        num_players: numPlayers, 
        total_price: totalPrice 
    });

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
