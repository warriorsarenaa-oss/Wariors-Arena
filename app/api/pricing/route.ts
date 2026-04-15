import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('game_durations')
      .select('id, duration_minutes, price_per_player, game_type_id, game_types(name, display_name_en, display_name_ar)')
      .order('duration_minutes', { ascending: true });

    if (error) {
      console.error('[PublicPricing] Database error:', error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ durations: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error';
    console.error('[PublicPricing] Caught error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
