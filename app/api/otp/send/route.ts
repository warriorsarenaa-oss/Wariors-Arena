import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase';

function sanitize(input: string): string {
    return input ? input.replace(/<[^>]*>?/gm, '') : '';
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        let { phone } = body;
        phone = sanitize(phone);

        if (!/^01[0125][0-9]{8}$/.test(phone)) {
            return NextResponse.json({ error: 'Invalid Egyptian phone format' }, { status: 400 });
        }

        // Rate limit: Check requests in last hour for this phone via OTP DB
        const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
        const { data: recentLogs, error: rateError } = await supabaseAdmin
            .from('otp_verifications')
            .select('id')
            .eq('phone', phone)
            .gte('created_at', oneHourAgo);

        if (recentLogs && recentLogs.length >= 10) {
            return NextResponse.json({ error: 'Too many attempts. Max 10 OTP requests per hour allowed.' }, { status: 429 });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Verification lasts exactly 10 minutes from now
        const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();

        const { error: dbError } = await supabaseAdmin
            .from('otp_verifications')
            .insert({ phone, otp, expires_at: expiresAt });
            
        if (dbError) {
             return NextResponse.json({ error: 'Database error storing OTP' }, { status: 500 });
        }

        // Send SMS via Vonage
        const vonageApiKey = process.env.VONAGE_API_KEY || '';
        const vonageApiSecret = process.env.VONAGE_API_SECRET || '';

        // Formatted for international code 20xxxxxxxxx without plus
        const formattedPhone = "2" + phone;

        const response = await fetch('https://rest.nexmo.com/sms/json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                api_key: vonageApiKey,
                api_secret: vonageApiSecret,
                to: formattedPhone,
                from: 'WarriorsArena',
                text: `Your Warriors Arena verification code is: ${otp}. Valid for 10 minutes.`
            })
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
