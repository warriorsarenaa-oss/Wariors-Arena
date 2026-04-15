import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '../../../../../lib/supabase';

async function validateAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('wa_admin_session')?.value;
  if (!token) return false;
  
  const { data } = await supabaseAdmin
    .from('admin_sessions')
    .select('id, expires_at')
    .eq('session_token', token)
    .single();
  
  if (!data) return false;
  if (new Date(data.expires_at) < new Date()) return false;
  return true;
}

export async function GET(req: NextRequest) {
  const isValid = await validateAdminSession();
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const dayOfWeek = searchParams.get('dayOfWeek');
  const specificDate = searchParams.get('specificDate');

  // 1. Always fetch global default slots
  const { data: defaultData } = await supabaseAdmin
    .from('working_hours_config')
    .select('slots')
    .is('day_of_week', null)
    .is('specific_date', null)
    .single();

  const defaultSlots = defaultData?.slots || [];

  // 2. Fetch specific override if requested
  let slots = [];
  let isOverride = false;

  if (dayOfWeek !== null || specificDate !== null) {
    let query = supabaseAdmin.from('working_hours_config').select('slots');
    
    if (dayOfWeek !== null) {
        query = query.eq('day_of_week', parseInt(dayOfWeek as string)).is('specific_date', null);
    } else if (specificDate !== null) {
        query = query.eq('specific_date', specificDate);
    }

    const { data: overrideData } = await query.single();
    
    if (overrideData && overrideData.slots) {
        slots = overrideData.slots;
        isOverride = true;
    }
  }

  return NextResponse.json({
    slots: isOverride ? slots : defaultSlots,
    defaultSlots: defaultSlots,
    isOverride: isOverride
  });
}

export async function PATCH(req: NextRequest) {
  const isValid = await validateAdminSession();
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { target, dayOfWeek, specificDate, slots } = await req.json();

    const updateData: any = {
      slots: slots,
      is_active: true,
      updated_at: new Date().toISOString()
    };

    let query: any;

    if (target === 'default') {
        const { data: existing } = await supabaseAdmin
            .from('working_hours_config')
            .select('id')
            .is('day_of_week', null)
            .is('specific_date', null)
            .single();

        if (existing?.id) {
            query = supabaseAdmin
                .from('working_hours_config')
                .update(updateData)
                .eq('id', existing.id);
        } else {
            query = supabaseAdmin
                .from('working_hours_config')
                .insert({ ...updateData, day_of_week: null, specific_date: null });
        }
    } else if (target === 'day') {
        const { data: existing } = await supabaseAdmin
            .from('working_hours_config')
            .select('id')
            .eq('day_of_week', dayOfWeek)
            .is('specific_date', null)
            .single();

        if (existing?.id) {
            query = supabaseAdmin
                .from('working_hours_config')
                .update(updateData)
                .eq('id', existing.id);
        } else {
            query = supabaseAdmin
                .from('working_hours_config')
                .insert({ ...updateData, day_of_week: dayOfWeek, specific_date: null });
        }
    } else if (target === 'date') {
        const { data: existing } = await supabaseAdmin
            .from('working_hours_config')
            .select('id')
            .eq('specific_date', specificDate)
            .single();

        if (existing?.id) {
            query = supabaseAdmin
                .from('working_hours_config')
                .update(updateData)
                .eq('id', existing.id);
        } else {
            query = supabaseAdmin
                .from('working_hours_config')
                .insert({ ...updateData, specific_date: specificDate });
        }
    }

    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, slots });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
