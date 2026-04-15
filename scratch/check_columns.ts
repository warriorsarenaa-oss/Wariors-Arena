import { supabaseAdmin } from '../lib/supabase';

async function checkColumns() {
  const { data, error } = await supabaseAdmin.from('manual_blocks').select('*').limit(1);
  if (error) {
    console.error('Error fetching from manual_blocks:', error.message);
  } else if (data && data.length > 0) {
    console.log('Columns in manual_blocks:', Object.keys(data[0]));
  } else {
    console.log('manual_blocks table is empty, trying direct select on information_schema...');
    // We can try to use RPC if defined, but let's try a simple select first.
  }
}

checkColumns();
