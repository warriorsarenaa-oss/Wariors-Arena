import { renderToBuffer, Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: { 
    padding: 40, 
    backgroundColor: '#FFFFFF', 
    fontFamily: 'Helvetica' 
  },
  logoText: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    marginBottom: 4 
  },
  confirmText: { 
    fontSize: 12, 
    color: '#666666', 
    textAlign: 'center', 
    marginBottom: 20 
  },
  codeLabel: { 
    fontSize: 10, 
    color: '#999999', 
    textAlign: 'center', 
    marginBottom: 6 
  },
  code: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#FF3B3B', 
    textAlign: 'center', 
    marginBottom: 24 
  },
  noticeBox: { 
    backgroundColor: '#FEF3C7', 
    padding: 12,
    marginBottom: 20 
  },
  noticeText: { 
    fontSize: 9, 
    color: '#92400E' 
  },
  row: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    paddingVertical: 8, 
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E7EB' 
  },
  rowLabel: { 
    fontSize: 10, 
    color: '#6B7280' 
  },
  rowValue: { 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  sectionTitle: { 
    marginTop: 16, 
    marginBottom: 8,
    fontSize: 11, 
    fontWeight: 'bold' 
  },
  cancelText: { 
    marginTop: 20, 
    fontSize: 9,
    color: '#6B7280', 
    textAlign: 'center' 
  },
  footer: { 
    marginTop: 12, 
    fontSize: 9,
    color: '#9CA3AF', 
    textAlign: 'center' 
  }
});

async function main() {
  let raw = '';
  // Set encoding to utf8 for stdin
  process.stdin.setEncoding('utf8');
  
  for await (const chunk of process.stdin) {
    raw += chunk;
  }
  
  if (!raw) {
    throw new Error('No input received');
  }

  const booking = JSON.parse(raw);

  const doc = React.createElement(Document, null,
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.logoText }, 'WARRIORS ARENA'),
      React.createElement(Text, { style: styles.confirmText }, 'BOOKING CONFIRMATION'),
      React.createElement(Text, { style: styles.codeLabel }, 'YOUR BOOKING CODE'),
      React.createElement(Text, { style: styles.code }, booking.booking_code),
      React.createElement(View, { style: styles.noticeBox },
        React.createElement(Text, { style: styles.noticeText },
          'IMPORTANT: Park entrance fees are NOT included. ' +
          '30 EGP/person regular days. ' +
          '50 EGP/person holidays and festivals.')
      ),
      React.createElement(Text, { style: styles.sectionTitle }, 'Booking Details'),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Date'),
        React.createElement(Text, { style: styles.rowValue }, booking.booking_date)
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Time'),
        React.createElement(Text, { style: styles.rowValue }, booking.slot_time)
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Players'),
        React.createElement(Text, { style: styles.rowValue }, String(booking.num_players))
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Total Price'),
        React.createElement(Text, { style: styles.rowValue }, String(booking.total_price) + ' EGP')
      ),
      React.createElement(Text, { style: styles.sectionTitle }, 'Customer Details'),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Name'),
        React.createElement(Text, { style: styles.rowValue }, booking.customer_name)
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Phone'),
        React.createElement(Text, { style: styles.rowValue }, booking.customer_phone)
      ),
      React.createElement(View, { style: styles.row },
        React.createElement(Text, { style: styles.rowLabel }, 'Email'),
        React.createElement(Text, { style: styles.rowValue }, booking.customer_email || 'N/A')
      ),
      React.createElement(Text, { style: styles.cancelText },
        'To cancel, please call us at least 6 hours before your session.'),
      React.createElement(Text, { style: styles.footer },
        'Warriors Arena - Heliopolis, Cairo')
    )
  );

  const buffer = await renderToBuffer(doc);
  process.stdout.write(buffer);
}

main().catch(err => {
  process.stderr.write(err.message);
  process.exit(1);
});
