import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

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

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "WA-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

    // 3. Fetch duration info
    const { data: duration, error: durError } = await supabaseAdmin
      .from("game_durations")
      .select("id, game_type_id, duration_minutes, price_per_player")
      .eq("id", durationId)
      .single();

    if (durError || !duration) {
      return NextResponse.json({ error: "Invalid duration ID" }, { status: 400 });
    }

    // 4. Calculate
    const slotEndTime = calculateEndTime(slotTime, duration.duration_minutes);
    const totalPrice = duration.price_per_player * numPlayers;
    const bookingCode = generateCode();

    console.log("[Bookings] Inserting:", { 
        booking_code: bookingCode, 
        slot_time: slotTime, 
        slot_end_time: slotEndTime, 
        num_players: numPlayers, 
        total_price: totalPrice 
    });

    // 5. INSERT into bookings using EXACTLY these column names
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

    console.log("[Bookings] Result:", JSON.stringify(data), "Error:", error?.message);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 6. Return mapped record for frontend
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
