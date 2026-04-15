import { supabaseAdmin } from '../lib/supabase';

async function probeBookings() {
  console.log('--- Probing bookings table ---');
  const table = 'bookings' as any;
  const { data, error } = await supabaseAdmin.from(table).select().limit(1);
  if (error) {
    console.log(`Table ${table} probe error:`, error.message);
  } else {
    console.log(`Table ${table} keys:`, data.length > 0 ? Object.keys(data[0]) : 'empty table');
  }
}

probeBookings();
