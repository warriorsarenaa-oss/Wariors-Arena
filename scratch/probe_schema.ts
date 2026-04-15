import { supabaseAdmin } from '../lib/supabase';

async function checkSchema() {
  console.log('--- Probing manual_blocks table ---');
  const table = 'manual_blocks' as any;
  const { data, error } = await supabaseAdmin.from(table).select().limit(1);
  if (error) {
    console.log(`Table ${table} probe error:`, error.message);
  } else {
    console.log(`Table ${table} keys:`, data.length > 0 ? Object.keys(data[0]) : 'empty table');
  }

  const columns = ['id', 'block_date', 'date', 'slot_time', 'time', 'slot_end_time', 'reason'];
  for (const col of columns) {
    const { error: colError } = await supabaseAdmin.from(table).select(col).limit(1);
    if (colError) {
      console.log(`Column ${col} does NOT exist: ${colError.message}`);
    } else {
      console.log(`Column ${col} EXISTS`);
    }
  }
}

checkSchema();
