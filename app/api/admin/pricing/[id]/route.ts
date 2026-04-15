export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';

async function validateAdminSession(
  request: NextRequest
): Promise<boolean> {
  const token = request.cookies.get('wa_admin_session')
    ?.value;
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('session_token', token)
    .single();
  if (!data) return false;
  return new Date(data.expires_at) > new Date();
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const isValid = await validateAdminSession(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const id = params.id;

    let body: { price_per_player: number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const price = Number(body.price_per_player);

    if (!price || isNaN(price) || price <= 0 || 
        !Number.isInteger(price)) {
      return NextResponse.json(
        { error: 'Price must be a positive whole number' },
        { status: 400 }
      );
    }

    console.log('[Pricing] Updating id:', id, 
      'to price:', price);

    const { data, error } = await supabaseAdmin
      .from('game_durations')
      .update({ price_per_player: price })
      .eq('id', id)
      .select('*, game_types(display_name_en)')
      .single();

    if (error) {
      console.error('[Pricing] Update error:', 
        error.message);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      duration: data,
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ?
      err.message : 'Server error';
    console.error('[Pricing] Caught error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
