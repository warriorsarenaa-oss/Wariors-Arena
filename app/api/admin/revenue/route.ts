import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../lib/supabase';

async function validateAdminSession(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('wa_admin_session')?.value;
    if (!token) return false;
    
    const { data, error } = await supabaseAdmin
      .from('admin_sessions')
      .select('id, expires_at')
      .eq('session_token', token)
      .single();
    
    if (error || !data) return false;
    if (new Date(data.expires_at) < new Date()) return false;
    return true;
  } catch (e) {
    return false;
  }
}

function toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export async function GET(req: NextRequest) {
  const isValid = await validateAdminSession();
  if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!from || !to) {
    return NextResponse.json({ error: 'Date range required' }, { status: 400 });
  }

  // Fetch all bookings in range
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      *,
      game_types (name, display_name_en)
    `)
    .gte('booking_date', from)
    .lte('booking_date', to)
    .order('booking_date', { ascending: true })
    .order('slot_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const confirmedBookings = (data || []).filter(b => b.status === 'confirmed');

  // Metrics (calculated for the full range)
  const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
  const totalGames = confirmedBookings.length;

  // EXPLICIT COUNT FOR GAME TYPES
  const { data: gameTypes } = await supabaseAdmin
    .from('game_types')
    .select('id, name');

  const laserTagId = gameTypes?.find(g => g.name === 'laser_tag')?.id;
  const gelBlastersId = gameTypes?.find(g => g.name === 'gel_blasters')?.id;

  const { count: laserTagCount } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .gte('booking_date', from)
    .lte('booking_date', to)
    .eq('game_type_id', laserTagId);

  const { count: gelBlastersCount } = await supabaseAdmin
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'confirmed')
    .gte('booking_date', from)
    .lte('booking_date', to)
    .eq('game_type_id', gelBlastersId);

  const startDate = new Date(from);
  const endDate = new Date(to);
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let chartData: any = null;

  if (from === to || diffDays === 1) {
    // 1 Day: Daily Slots
    const slots = ['18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];
    const slotLabels: Record<string, string> = {
      '18:00': '6:00 PM', '18:30': '6:30 PM', '19:00': '7:00 PM',
      '19:30': '7:30 PM', '20:00': '8:00 PM', '20:30': '8:30 PM'
    };
    chartData = {
      type: 'daily',
      data: slots.map(s => {
        const rev = confirmedBookings
          .filter(b => b.slot_time.substring(0, 5) === s)
          .reduce((sum, b) => sum + (b.total_price || 0), 0);
        return { label: slotLabels[s], key: s, revenue: rev, count: confirmedBookings.filter(b => b.slot_time.substring(0, 5) === s).length };
      })
    };
  } else if (diffDays <= 7) {
    // 2-7 Days: Weekly (by Actual Day Name)
    const weekData = [];
    const curr = new Date(startDate);
    for (let i = 0; i < diffDays; i++) {
        const dStr = toLocalDateString(curr);
        const rev = confirmedBookings
          .filter(b => b.booking_date === dStr)
          .reduce((sum, b) => sum + (b.total_price || 0), 0);
        
        weekData.push({
            date: dStr,
            dayLabel: DAY_LABELS[curr.getDay()],
            revenue: rev
        });
        curr.setDate(curr.getDate() + 1);
    }
    chartData = { type: 'weekly', data: weekData };
  } else {
    // 8+ Days: Monthly (Weeks 1-4)
    const weeks = [
        { label: 'Week 1', days: [1, 7], revenue: 0 },
        { label: 'Week 2', days: [8, 14], revenue: 0 },
        { label: 'Week 3', days: [15, 21], revenue: 0 },
        { label: 'Week 4', days: [22, 31], revenue: 0 }
    ];

    confirmedBookings.forEach(b => {
        const day = parseInt(b.booking_date.split('-')[2]);
        if (day >= 1 && day <= 7) weeks[0].revenue += (b.total_price || 0);
        else if (day >= 8 && day <= 14) weeks[1].revenue += (b.total_price || 0);
        else if (day >= 15 && day <= 21) weeks[2].revenue += (b.total_price || 0);
        else if (day >= 22) weeks[3].revenue += (b.total_price || 0);
    });

    chartData = {
        type: 'monthly',
        data: weeks.map(w => ({ weekLabel: w.label, revenue: w.revenue }))
    };
  }

  return NextResponse.json({
    totalRevenue,
    totalGames,
    laserTagCount: laserTagCount || 0,
    gelBlastersCount: gelBlastersCount || 0,
    chartData
  });
}
