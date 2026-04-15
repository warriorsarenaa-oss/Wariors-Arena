import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';
import crypto from 'crypto';

function sanitize(input: string): string {
    return input ? input.replace(/<[^>]*>?/gm, '') : '';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let { phone, otp } = body;
        phone = sanitize(phone);
        otp = sanitize(otp);

        const { data: record, error } = await supabaseAdmin
            .from('otp_verifications')
            .select('*')
            .eq('phone', phone)
            .eq('verified', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !record) {
             return NextResponse.json({ error: 'No pending OTP found' }, { status: 400 });
        }

        if (record.attempts >= 5) {
             return NextResponse.json({ error: 'Too many attempts. Request a new code.' }, { status: 429 });
        }

        const now = new Date();
        const expiresAt = new Date(record.expires_at);

        if (now > expiresAt) {
             return NextResponse.json({ error: 'Code expired. Please request a new one.' }, { status: 410 });
        }

        if (record.otp !== otp) {
             const newAttempts = record.attempts + 1;
             await supabaseAdmin.from('otp_verifications').update({ attempts: newAttempts }).eq('id', record.id);
             return NextResponse.json({ error: `Invalid code. ${5 - newAttempts} attempts remaining.` }, { status: 401 });
        }

        // Successfully matched the OTP. Generate a secure backend pass token.
        const shortToken = crypto.randomBytes(16).toString('hex');
        
        // Note: The schema definition didn't explicitly outline a unique column mapping for active sessions
        // Instead of building a complex JWT scheme for this public form, we store this 10-minute token 
        // overlapping the explicit 'otp' string cell or just returning it for state-management locally.
        await supabaseAdmin.from('otp_verifications').update({ 
            verified: true, 
            otp: shortToken 
        }).eq('id', record.id);

        return NextResponse.json({ verified: true, token: shortToken }, { status: 200 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
