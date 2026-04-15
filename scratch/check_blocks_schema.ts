
import { supabaseAdmin } from './lib/supabase';

async function checkSchema() {
  const { data, error } = await supabaseAdmin.rpc('get_table_info', { table_name: 'manual_blocks' });
  
  if (error) {
    // If RPC doesn't exist, try a simple select to see keys
    const { data: sample, error: sampleError } = await supabaseAdmin
      .from('manual_blocks')
      .select('*')
      .limit(1);
      
    if (sampleError) {
      console.error('Error fetching sample:', sampleError.message);
      return;
    }
    
    if (sample && sample.length > 0) {
      console.log('Columns found in sample:', Object.keys(sample[0]));
    } else {
      console.log('No data in manual_blocks to check columns.');
      // Try to insert a dummy row to see errors? No, let's try another way.
    }
  } else {
    console.log('Table Info:', data);
  }
}

checkSchema();
