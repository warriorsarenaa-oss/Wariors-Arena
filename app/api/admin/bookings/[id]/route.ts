import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase';

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params;
  const id = params.id;
  
  const isValid = await validateAdminSession(request);

  if (!isValid) {
    return NextResponse.json(
      { error: 'Unauthorized' }, 
      { status: 401 }
    );
  }

  let body: { status: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' }, 
      { status: 400 }
    );
  }

  if (!['cancelled', 'confirmed'].includes(body.status)) {
    return NextResponse.json(
      { error: 'Invalid status value' }, 
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .update({ 
      status: body.status
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('[Admin PATCH booking] Error:', error.message);
    return NextResponse.json(
      { error: error.message }, 
      { status: 500 }
    );
  }

  return NextResponse.json({ 
    success: true, 
    booking: data 
  });
}
