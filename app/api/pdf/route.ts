export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const booking = await request.json();

    if (!booking || !booking.booking_code) {
      return NextResponse.json(
        { error: 'Invalid booking data' },
        { status: 400 }
      );
    }

    const buffer = await generatePdf(booking);

    return new NextResponse(
      buffer as unknown as BodyInit,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition':
            'attachment; filename="' +
            booking.booking_code +
            '.pdf"',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error
      ? err.message
      : 'PDF generation failed';
    console.error('[PDF] Error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

async function generatePdf(booking: any): Promise<Buffer> {
  const React = await import('react');
  const { renderToBuffer, Document, Page, View, Text,
    StyleSheet } = await import('@react-pdf/renderer');

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica',
    },
    header: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 2,
      borderBottomColor: '#00FFCC',
      alignItems: 'center',
    },
    logoText: {
      fontSize: 22,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    subText: {
      fontSize: 11,
      color: '#666666',
      textAlign: 'center',
      marginTop: 4,
    },
    codeBox: {
      alignItems: 'center',
      marginVertical: 20,
      padding: 20,
      backgroundColor: '#FFF5F5',
    },
    codeLabel: {
      fontSize: 10,
      color: '#999999',
      letterSpacing: 2,
      marginBottom: 8,
    },
    code: {
      fontSize: 30,
      fontWeight: 'bold',
      color: '#FF3B3B',
      letterSpacing: 3,
    },
    noticeBox: {
      backgroundColor: '#FEF3C7',
      padding: 12,
      marginBottom: 16,
    },
    noticeTitle: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#92400E',
      marginBottom: 4,
    },
    noticeText: {
      fontSize: 9,
      color: '#92400E',
      lineHeight: 1.5,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: 'bold',
      marginTop: 14,
      marginBottom: 6,
      color: '#333333',
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 7,
      borderBottomWidth: 0.5,
      borderBottomColor: '#E5E7EB',
    },
    label: {
      fontSize: 10,
      color: '#6B7280',
    },
    value: {
      fontSize: 10,
      fontWeight: 'bold',
      color: '#111827',
    },
    footer: {
      marginTop: 24,
      fontSize: 9,
      color: '#9CA3AF',
      textAlign: 'center',
    },
    cancelNote: {
      marginTop: 16,
      fontSize: 9,
      color: '#6B7280',
      textAlign: 'center',
      lineHeight: 1.5,
    },
  });

  function fmt(time: string): string {
    if (!time) return '';
    const t = time.substring(0, 5);
    const [h, m] = t.split(':').map(Number);
    const p = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return hr + ':' + String(m).padStart(2, '0') + ' ' + p;
  }

  const c = React.createElement;

  const doc = c(Document, null,
    c(Page, { size: 'A4', style: styles.page },

      c(View, { style: styles.header },
        c(Text, { style: styles.logoText },
          'WARRIORS ARENA'),
        c(Text, { style: styles.subText },
          'Laser Tag & Gel Blasters — Heliopolis, Cairo')
      ),

      c(View, { style: styles.codeBox },
        c(Text, { style: styles.codeLabel },
          'BOOKING CONFIRMATION CODE'),
        c(Text, { style: styles.code },
          String(booking.booking_code || ''))
      ),

      c(View, { style: styles.noticeBox },
        c(Text, { style: styles.noticeTitle },
          'IMPORTANT — Park Entrance Not Included'),
        c(Text, { style: styles.noticeText },
          '30 EGP per person on regular days. ' +
          '50 EGP per person on holidays and festivals.')
      ),

      c(Text, { style: styles.sectionLabel },
        'Booking Details'),

      c(View, { style: styles.row },
        c(Text, { style: styles.label }, 'Date'),
        c(Text, { style: styles.value },
          String(booking.booking_date || ''))
      ),
      c(View, { style: styles.row },
        c(Text, { style: styles.label }, 'Time'),
        c(Text, { style: styles.value },
          fmt(booking.slot_time || ''))
      ),
      c(View, { style: styles.row },
        c(Text, { style: styles.label }, 'Players'),
        c(Text, { style: styles.value },
          String(booking.num_players || ''))
      ),
      c(View, { style: styles.row },
        c(Text, { style: styles.label }, 'Total Price'),
        c(Text, { style: styles.value },
          String(booking.total_price || '') + ' EGP')
      ),

      c(Text, { style: styles.sectionLabel },
        'Customer Details'),

      c(View, { style: styles.row },
        c(Text, { style: styles.label }, 'Name'),
        c(Text, { style: styles.value },
          String(booking.customer_name || ''))
      ),
      c(View, { style: styles.row },
        c(Text, { style: styles.label }, 'Phone'),
        c(Text, { style: styles.value },
          String(booking.customer_phone || ''))
      ),
      c(View, { style: styles.row },
        c(Text, { style: styles.label }, 'Email'),
        c(Text, { style: styles.value },
          String(booking.customer_email || ''))
      ),

      c(Text, { style: styles.cancelNote },
        'To cancel, please call us at least 6 hours ' +
        'before your session start time.'),

      c(Text, { style: styles.footer },
        'Warriors Arena — Heliopolis, Cairo')
    )
  );

  const result = await renderToBuffer(doc as any);
  return result as unknown as Buffer;
}
