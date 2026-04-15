import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const gameType = searchParams.get('gameType');
        const durationMinutes = searchParams.get('durationMinutes');

        if (!gameType || !durationMinutes) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        // Fetch duration by joining with game_types on name
        const { data, error } = await supabaseAdmin
            .from('game_durations')
            .select('id, duration_minutes, price_per_player, game_types!inner(name)')
            .eq('game_types.name', gameType)
            .eq('duration_minutes', parseInt(durationMinutes, 10))
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Duration not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: data.id,
            duration_minutes: data.duration_minutes,
            price_per_player: data.price_per_player
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
