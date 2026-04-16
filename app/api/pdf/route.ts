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

    const pdfBuffer = await generatePdfBuffer(booking);

    const filename = (booking.booking_code || 'booking') 
      + '.pdf';

    return new NextResponse(
      pdfBuffer as unknown as BodyInit,
      {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 
            'attachment; filename="' + filename + '"',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? 
      err.message : 'PDF generation failed';
    console.error('[PDF] Error:', msg);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

async function generatePdfBuffer(booking: any): 
  Promise<Buffer> {
  
  const ReactPDF = await import('@react-pdf/renderer');
  const { renderToBuffer, Document, Page, View, Text, 
    StyleSheet } = ReactPDF;
  
  const React = await import('react');

  const styles = StyleSheet.create({
    page: { 
      padding: 40, 
      backgroundColor: '#FFFFFF',
      fontFamily: 'Helvetica'
    },
    header: { 
      marginBottom: 24, 
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: '#00FFCC',
      paddingBottom: 16,
    },
    logoText: { 
      fontSize: 24, 
      fontWeight: 'bold',
      textAlign: 'center',
    },
    subText: {
      fontSize: 12,
      color: '#666666',
      textAlign: 'center',
      marginTop: 4,
    },
    codeSection: {
      alignItems: 'center',
      marginVertical: 24,
      padding: 20,
      backgroundColor: '#FFF5F5',
      borderRadius: 8,
    },
    codeLabel: { 
      fontSize: 10, 
      color: '#999999',
      letterSpacing: 2,
      marginBottom: 8,
    },
    code: { 
      fontSize: 32, 
      fontWeight: 'bold',
      color: '#FF3B3B',
      letterSpacing: 4,
    },
    noticeBox: { 
      backgroundColor: '#FEF3C7', 
      padding: 14,
      borderRadius: 6,
      marginBottom: 20,
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
    sectionTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#333333',
      marginBottom: 8,
      marginTop: 16,
    },
    row: { 
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8, 
      borderBottomWidth: 0.5,
      borderBottomColor: '#E5E7EB',
    },
    rowLabel: { 
      fontSize: 10, 
      color: '#6B7280',
    },
    rowValue: { 
      fontSize: 10, 
      fontWeight: 'bold',
      color: '#111827',
    },
    cancelText: { 
      marginTop: 20, 
      fontSize: 9,
      color: '#6B7280', 
      textAlign: 'center',
      lineHeight: 1.5,
    },
    footer: { 
      marginTop: 16, 
      fontSize: 9,
      color: '#9CA3AF', 
      textAlign: 'center',
    },
  });

  function formatTime(time: string): string {
    if (!time) return '';
    const clean = time.substring(0, 5);
    const [h, m] = clean.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return hour + ':' + String(m).padStart(2, '0') + 
      ' ' + period;
  }

  const e = React.createElement;

  const doc = e(Document, null,
    e(Page, { size: 'A4', style: styles.page },
      e(View, { style: styles.header },
        e(Text, { style: styles.logoText }, 
          'WARRIORS ARENA'),
        e(Text, { style: styles.subText },
          'Laser Tag & Gel Blasters — Heliopolis, Cairo')
      ),
      e(View, { style: styles.codeSection },
        e(Text, { style: styles.codeLabel },
          'BOOKING CONFIRMATION CODE'),
        e(Text, { style: styles.code },
          booking.booking_code || '')
      ),
      e(View, { style: styles.noticeBox },
        e(Text, { style: styles.noticeTitle },
          'IMPORTANT — Park Entrance Not Included'),
        e(Text, { style: styles.noticeText },
          'Park entrance fees are separate from your reservation.\n' +
          '30 EGP per person on regular days.\n' +
          '50 EGP per person on holidays and festivals.')
      ),
      e(Text, { style: styles.sectionTitle },
        'Booking Details'),
      e(View, { style: styles.row },
        e(Text, { style: styles.rowLabel }, 'Date'),
        e(Text, { style: styles.rowValue },
          booking.booking_date || '')
      ),
      e(View, { style: styles.row },
        e(Text, { style: styles.rowLabel }, 'Time'),
        e(Text, { style: styles.rowValue },
          formatTime(booking.slot_time || ''))
      ),
      e(View, { style: styles.row },
        e(Text, { style: styles.rowLabel }, 'Players'),
        e(Text, { style: styles.rowValue },
          String(booking.num_players || ''))
      ),
      e(View, { style: styles.row },
        e(Text, { style: styles.rowLabel }, 'Total Price'),
        e(Text, { style: styles.rowValue },
          String(booking.total_price || '') + ' EGP')
      ),
      e(Text, { style: styles.sectionTitle },
        'Customer Details'),
      e(View, { style: styles.row },
        e(Text, { style: styles.rowLabel }, 'Name'),
        e(Text, { style: styles.rowValue },
          booking.customer_name || '')
      ),
      e(View, { style: styles.row },
        e(Text, { style: styles.rowLabel }, 'Phone'),
        e(Text, { style: styles.rowValue },
          booking.customer_phone || '')
      ),
      e(View, { style: styles.row },
        e(Text, { style: styles.rowLabel }, 'Email'),
        e(Text, { style: styles.rowValue },
          booking.customer_email || '')
      ),
      e(Text, { style: styles.cancelText },
        'To cancel your reservation, please call us at\n' +
        'least 6 hours before your session start time.'
      ),
      e(Text, { style: styles.footer },
        'Warriors Arena — Heliopolis, Cairo')
    )
  );

  const buffer = await renderToBuffer(doc as any);
  return buffer as unknown as Buffer;
}
