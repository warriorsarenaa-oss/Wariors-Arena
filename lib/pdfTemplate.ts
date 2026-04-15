import { Document, Page, View, Text, StyleSheet, createElement } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#FFFFFF' },
  header: { marginBottom: 20 },
  logoText: { fontSize: 22, fontWeight: 'bold', 
    textAlign: 'center' },
  confirmText: { fontSize: 12, color: '#666666', 
    textAlign: 'center', marginTop: 4 },
  codeBox: { alignItems: 'center', marginBottom: 24,
    padding: 16, backgroundColor: '#FFF5F5' },
  codeLabel: { fontSize: 10, color: '#999999', 
    marginBottom: 6 },
  code: { fontSize: 28, fontWeight: 'bold', 
    color: '#FF3B3B' },
  noticeBox: { backgroundColor: '#FEF3C7', padding: 12,
    marginBottom: 20 },
  noticeText: { fontSize: 9, color: '#92400E' },
  row: { flexDirection: 'row', 
    justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB' },
  rowLabel: { fontSize: 10, color: '#6B7280' },
  rowValue: { fontSize: 10, fontWeight: 'bold' },
  sectionTitle: { marginTop: 16, marginBottom: 8,
    fontSize: 11, fontWeight: 'bold' },
  cancelText: { marginTop: 20, fontSize: 9,
    color: '#6B7280', textAlign: 'center' },
  footer: { marginTop: 12, fontSize: 9,
    color: '#9CA3AF', textAlign: 'center' }
});

export interface BookingPdfData {
  booking_code: string;
  booking_date: string;
  slot_time: string;
  num_players: number;
  total_price: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
}

function row(label: string, value: string) {
  return createElement(View, { style: styles.row },
    createElement(Text, { style: styles.rowLabel }, label),
    createElement(Text, { style: styles.rowValue }, value)
  );
}

export function buildPdfDocument(booking: BookingPdfData) {
  return createElement(Document, null,
    createElement(Page, { size: 'A4', style: styles.page },
      createElement(View, { style: styles.header },
        createElement(Text, { style: styles.logoText }, 
          'WARRIORS ARENA'),
        createElement(Text, { style: styles.confirmText }, 
          'BOOKING CONFIRMATION')
      ),
      createElement(View, { style: styles.codeBox },
        createElement(Text, { style: styles.codeLabel }, 
          'YOUR BOOKING CODE'),
        createElement(Text, { style: styles.code }, 
          booking.booking_code)
      ),
      createElement(View, { style: styles.noticeBox },
        createElement(Text, { style: styles.noticeText },
          'IMPORTANT: Park entrance fees are NOT included. ' +
          '30 EGP/person regular days. ' +
          '50 EGP/person holidays and festivals.')
      ),
      createElement(Text, { style: styles.sectionTitle },
        'Booking Details'),
      row('Date', booking.booking_date),
      row('Time', booking.slot_time),
      row('Players', String(booking.num_players)),
      row('Total Price', String(booking.total_price) + ' EGP'),
      createElement(Text, { style: styles.sectionTitle },
        'Customer Details'),
      row('Name', booking.customer_name),
      row('Phone', booking.customer_phone),
      row('Email', booking.customer_email),
      createElement(Text, { style: styles.cancelText },
        'To cancel, call us at least 6 hours before your session.'),
      createElement(Text, { style: styles.footer },
        'Warriors Arena - Heliopolis, Cairo')
    )
  );
}
