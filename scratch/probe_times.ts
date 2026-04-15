import { supabaseAdmin } from '../lib/supabase';

async function checkColumns() {
  const table = 'manual_blocks' as any;
  const commonNames = [
    'time', 'start_time', 'end_time', 'slot', 'slot_time', 'block_time', 
    'begin_time', 'finish_time', 'slot_start', 'slot_end'
  ];
  
  for (const col of commonNames) {
    const { error } = await supabaseAdmin.from(table).select(col).limit(1);
    if (!error) {
      console.log(`Column ${col} EXISTS`);
    }
  }
}

checkColumns();
