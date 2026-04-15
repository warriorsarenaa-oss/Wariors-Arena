export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const booking = await request.json();
    console.log('[PDF] Spawning generator for:', booking.booking_code);

    const scriptPath = path.join(process.cwd(), 'scripts', 'generatePdf.mjs');

    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const child = spawn(
        process.execPath, 
        [scriptPath],
        { stdio: ['pipe', 'pipe', 'pipe'] }
      );

      const chunks: Buffer[] = [];
      const errChunks: Buffer[] = [];

      child.stdout.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      child.stderr.on('data', (chunk: Buffer) => {
        errChunks.push(chunk);
      });

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve(Buffer.concat(chunks));
        } else {
          const errMsg = Buffer.concat(errChunks).toString();
          reject(new Error('PDF script failed: ' + errMsg));
        }
      });

      child.on('error', (err: Error) => {
        reject(err);
      });

      // Write data to the script's stdin
      child.stdin.write(JSON.stringify(booking));
      child.stdin.end();
    });

    const filename = (booking.booking_code || 'booking') + '.pdf';

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'PDF generation failed';
    console.error('[PDF] Error:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
