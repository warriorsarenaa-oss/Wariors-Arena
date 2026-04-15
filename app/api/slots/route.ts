import { NextRequest, NextResponse } from 'next/server';
import { getAvailableSlots } from '../../../lib/slotEngine';

const rateLimitMap = new Map<string, { count: number, resetTime: number }>();

function sanitize(input: string): string {
    return input ? input.replace(/<[^>]*>?/gm, '') : '';
}

export async function GET(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const rateLimit = rateLimitMap.get(ip);
    
    if (rateLimit) {
        if (now > rateLimit.resetTime) {
            rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
        } else if (rateLimit.count >= 30) {
            return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
        } else {
            rateLimit.count++;
        }
    } else {
        rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    }

    const { searchParams } = new URL(req.url);
    const dateParam = sanitize(searchParams.get('date') || '');
    const gameType = sanitize(searchParams.get('gameType') || '') as any;
    const durationParam = sanitize(searchParams.get('durationMinutes') || '');

    if (!dateParam || !gameType || !durationParam) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const durationMinutes = parseInt(durationParam, 10);
    
    // Proper local date parsing to prevent day-shifting
    const [year, month, day] = dateParam.split('-').map(Number);
    const date = new Date(year, month - 1, day, 12, 0, 0);

    if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    try {
        const slots = await getAvailableSlots(date, gameType, durationMinutes as 30 | 60);
        return NextResponse.json({ slots });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
