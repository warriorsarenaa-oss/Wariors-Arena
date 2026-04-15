import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

async function validateAdminSession(
  request: NextRequest
): Promise<boolean> {
  const token = request.cookies.get('wa_admin_session')?.value;
  if (!token) return false;
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('session_token', token)
    .single();
  if (!data) return false;
  return new Date(data.expires_at) > new Date();
}

export async function GET(request: NextRequest) {
  try {
    const isValid = await validateAdminSession(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json(
        { blocks: [] }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('manual_blocks')
      .select('id, block_date, slot_time:start_time, slot_end_time:end_time, reason')
      .eq('block_date', date)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[Blocks GET] Error:', error.message);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      blocks: data || [] 
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? 
      err.message : 'Unknown error';
    console.error('[Blocks GET] Caught error:', msg);
    return NextResponse.json(
      { error: msg }, 
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isValid = await validateAdminSession(request);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Unauthorized' }, 
        { status: 401 }
      );
    }

    const body = await request.json();
    const { block_date, slot_time, slot_end_time, 
      reason } = body;

    if (!block_date || !slot_time || !slot_end_time) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('manual_blocks')
      .insert({ 
        block_date, 
        start_time: slot_time, 
        end_time: slot_end_time, 
        reason: reason || null 
      })
      .select()
      .single();

    if (error) {
      console.error('[Blocks POST] Error:', error.message);
      return NextResponse.json(
        { error: error.message }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      block: data 
    }, { status: 201 });

  } catch (err: unknown) {
    const msg = err instanceof Error ? 
      err.message : 'Unknown error';
    console.error('[Blocks POST] Caught error:', msg);
    return NextResponse.json(
      { error: msg }, 
      { status: 500 }
    );
  }
}
