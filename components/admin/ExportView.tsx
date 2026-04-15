"use client";

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Loader2,
  Calendar,
  CheckCircle2
} from 'lucide-react';

function getTodayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

export default function ExportView() {
    const [fromDate, setFromDate] = useState(getTodayStr);
    const [toDate, setToDate] = useState(getTodayStr);
    const [loading, setLoading] = useState(false);

    async function handleExport() {
      if (!fromDate || !toDate) {
        alert('Please select both start and end dates');
        return;
      }

      setLoading(true);

      try {
        const res = await fetch(
          '/api/admin/bookings?from=' + fromDate + 
          '&to=' + toDate
        );

        if (!res.ok) {
          const err = await res.json();
          alert('Export failed: ' + (err.error || 'Server error'));
          return;
        }

        const data = await res.json();
        const bookings = data.bookings || [];

        if (bookings.length === 0) {
          alert('No bookings found for the selected date range: ' + fromDate + ' to ' + toDate);
          return;
        }

        // Generate Excel
        const XLSX = await import('xlsx');
        
        const rows = bookings.map((b: any) => ({
          'Booking Code': b.booking_code || '',
          'Customer Name': b.customer_name || '',
          'Phone': b.customer_phone || '',
          'Email': b.customer_email || '',
          'Game': b.gameName || b.game_type_id || '',
          'Duration (min)': b.durationMinutes || b.duration_minutes || '',
          'Date': b.booking_date || '',
          'Time': b.slot_time ? b.slot_time.substring(0, 5) : '',
          'Players': b.num_players || '',
          'Total Revenue (EGP)': b.total_price || '',
          'Status': b.status || '',
          'Booked At': b.created_at ? new Date(b.created_at).toLocaleString() : '',
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(
          workbook, worksheet, 'Bookings'
        );

        const filename = 'warriors-arena-' + fromDate + '-to-' + toDate + '.xlsx';
        XLSX.writeFile(workbook, filename);

        alert('Export complete: ' + bookings.length + ' bookings exported');

      } catch (err) {
        console.error('[Export] Error:', err);
        alert('Export failed. Check console for details.');
      } finally {
        setLoading(false);
      }
    }

    return (
        <div className="max-w-2xl space-y-8 pb-20">
            <section className="bg-[#13131A] p-10 rounded-[12px] border border-[#1E1E2E] shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5">
                      <FileSpreadsheet size={120} />
                 </div>
                 
                 <header className="mb-12 relative z-10">
                      <div className="w-16 h-16 rounded-[12px] bg-[#00FFCC]/10 flex items-center justify-center text-[#00FFCC] mb-6">
                           <FileSpreadsheet size={32} />
                      </div>
                      <h4 className="text-3xl font-black text-[#00FFCC] uppercase tracking-tighter">INTELLIGENCE EXPORT</h4>
                      <p className="text-[10px] text-[#A0A0B8] font-bold uppercase tracking-[0.2em] mt-2">Export Protocol: Excel (.xlsx)</p>
                 </header>

                 <div className="space-y-8 relative z-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-[#A0A0B8] tracking-widest ml-1">TEMPORAL START</label>
                                <div className="relative group">
                                     <input
                                      type="date"
                                      value={fromDate}
                                      onChange={(e) => setFromDate(e.target.value)}
                                      className="w-full bg-[#0A0A0F] border border-[#1E1E2E] p-4 rounded-[8px] text-xs font-bold focus:border-[#00FFCC] transition-all outline-none text-white"
                                      style={{ colorScheme: 'dark' }}
                                     />
                                     {!fromDate && <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0B8] group-hover:text-[#00FFCC] transition-colors pointer-events-none" size={18} />}
                                </div>
                           </div>
                           <div className="space-y-2">
                                <label className="text-[9px] font-black uppercase text-[#A0A0B8] tracking-widest ml-1">TEMPORAL END</label>
                                <div className="relative group">
                                     <input
                                      type="date"
                                      value={toDate}
                                      onChange={(e) => setToDate(e.target.value)}
                                      className="w-full bg-[#0A0A0F] border border-[#1E1E2E] p-4 rounded-[8px] text-xs font-bold focus:border-[#00FFCC] transition-all outline-none text-white"
                                      style={{ colorScheme: 'dark' }}
                                     />
                                     {!toDate && <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A0A0B8] group-hover:text-[#00FFCC] transition-colors pointer-events-none" size={18} />}
                                </div>
                           </div>
                      </div>

                      <button 
                        onClick={handleExport}
                        disabled={loading}
                        className="w-full bg-[#00FFCC] text-[#0A0A0F] py-5 rounded-[8px] font-black uppercase tracking-[0.1em] text-sm flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_10px_30px_rgba(0,255,204,0.15)]"
                      >
                           {loading ? <Loader2 className="animate-spin" size={20} /> : <><Download size={22} /> Export Excel (.xlsx)</>}
                      </button>
                 </div>

                 <div className="mt-12 pt-8 border-t border-[#1E1E2E] flex items-center gap-4 relative z-10">
                      <CheckCircle2 className="text-[#00FFCC] shrink-0" size={20} />
                      <p className="text-[9px] text-[#A0A0B8] font-bold uppercase leading-relaxed tracking-widest opacity-60">
                          Mission intel is extracted as an RFC-standard binary stream. Data includes all confirmed deployments within the specified temporal vector.
                      </p>
                 </div>
            </section>
        </div>
    );
}
