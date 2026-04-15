export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { buildPdfDocument } from '../../../lib/pdfTemplate';

export async function POST(request: NextRequest) {
  try {
    const booking = await request.json();
    console.log('[PDF] Generating for:', booking.booking_code);

    const doc = buildPdfDocument(booking);
    const buffer = await renderToBuffer(doc);

    const filename = (booking.booking_code || 'booking') + '.pdf';

    const uint8Array = new Uint8Array(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' +
          filename + '"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message :
      'PDF generation failed';
    console.error('[PDF] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
