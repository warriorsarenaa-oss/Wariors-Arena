"use client";

import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Phone, 
  Mail, 
  Clock, 
  Users, 
  Trash2, 
  X,
  Target,
  Loader2,
  AlertCircle
} from 'lucide-react';

export default function ReservationsView() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Manual Booking Form State
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [manualForm, setManualForm] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    gameName: '',
    durationId: '',
    numPlayers: 1
  });
  const [manualError, setManualError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  async function loadDateData(date: Date) {
    setLoading(true);
    const dateStr = toDateStr(date);
    console.log('[ReservationsView] Loading date:', dateStr);
    
    try {
      const [bookingsRes, blocksRes] = await Promise.all([
        fetch('/api/admin/bookings?date=' + dateStr),
        fetch('/api/admin/blocks?date=' + dateStr)
          .catch(() => ({ 
            ok: true, 
            json: async () => ({ blocks: [] }) 
          }))
      ]);

      const bookingsData = await bookingsRes.json();
      const blocksData = await blocksRes.json();

      console.log('[ReservationsView] Raw bookings:', JSON.stringify(bookingsData.bookings));

      setBookings(bookingsData.bookings || []);
      setBlocks(blocksData.blocks || []);
      
    } catch (err) {
      console.error('[ReservationsView] Load error:', err);
      setBookings([]);
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPricing() {
    try {
      const res = await fetch('/api/admin/pricing');
      const data = await res.json();
      setPricingData(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[Pricing] Failed to load:', e);
    }
  }

  useEffect(() => {
    loadDateData(currentDate);
    fetchPricing();
  }, [currentDate]);

  function timeToMinutes(time: string): number {
    const clean = time.substring(0, 5); // "HH:MM"
    const [h, m] = clean.split(':').map(Number);
    return h * 60 + m;
  }

  function formatDisplay(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return hour + ':' + String(m).padStart(2, '0') + ' ' + period;
  }

  const WORKING_SLOTS = [
    '18:00', '18:30', '19:00',
    '19:30', '20:00', '20:30'
  ];

  const confirmedBookings = bookings.filter(
    b => b.status === 'confirmed'
  );

  console.log('[ReservationsView] Confirmed bookings:', 
    confirmedBookings.length,
    confirmedBookings.map(b => b.slot_time)
  );

  function isSlotOccupied(slotTime: string): {
    occupied: boolean;
    booking: any | null;
  } {
    const slotStart = timeToMinutes(slotTime);
    const slotEnd = slotStart + 30;

    for (const booking of confirmedBookings) {
      const bStart = timeToMinutes(booking.slot_time);
      const bEnd = timeToMinutes(booking.slot_end_time || booking.slot_time);
      
      // Overlap check
      if (bStart < slotEnd && bEnd > slotStart) {
        return { occupied: true, booking };
      }
    }
    return { occupied: false, booking: null };
  }

  const slotGrid = WORKING_SLOTS.map(slotTime => {
    const { occupied, booking } = isSlotOccupied(slotTime);
    const block = blocks.find(b =>
      b.slot_time && b.slot_time.substring(0, 5) === slotTime
    );
    
    const status = block ? 'blocked' :
                   occupied ? 'booked' : 'available';

    console.log('[Grid] Slot', slotTime, '->', status,
      occupied ? '(booking: ' + booking?.booking_code + ')' : '');

    return {
      time: slotTime,
      displayTime: formatDisplay(slotTime),
      status,
      booking: occupied ? booking : null,
      block: block || null,
    };
  });

  async function handleCancel(bookingId: string) {
    try {
      const res = await fetch(
        '/api/admin/bookings/' + bookingId,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        }
      );
      if (!res.ok) {
        const err = await res.json();
        alert('Cancel failed: ' + err.error);
        return;
      }
      setSelectedBooking(null);
      await loadDateData(currentDate);
    } catch (err) {
      alert('Network error. Try again.');
    }
  }

  async function handleManualSubmit() {
    setManualError(null);
    if (!manualForm.customerName || !manualForm.customerPhone || !manualForm.durationId) {
      setManualError('Full Name, Phone, and Duration are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/manual-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          durationId: manualForm.durationId,
          date: toDateStr(currentDate),
          slotTime: selectedSlotTime,
          numPlayers: manualForm.numPlayers,
          customerName: manualForm.customerName,
          customerPhone: manualForm.customerPhone,
          customerEmail: manualForm.customerEmail || 'N/A'
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setManualError(data.error || 'Failed to create booking.');
        return;
      }

      setShowManualModal(false);
      setSelectedSlotTime(null);
      setManualForm({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        gameName: '',
        durationId: '',
        numPlayers: 1
      });
      await loadDateData(currentDate);
      alert(`Booking confirmed — ${data.bookingCode}`);
    } catch (err) {
      setManualError('Network error. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function goToPrevDay() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  }
  function goToNextDay() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  }
  function goToToday() {
    setCurrentDate(new Date());
  }

  const uniqueGameNames = Array.from(new Set(pricingData.map(p => p.gameName)));
  const filteredDurations = pricingData.filter(p => p.gameName === manualForm.gameName);
  const selectedDuration = pricingData.find(p => p.id === manualForm.durationId);
  const calculatedTotal = selectedDuration ? selectedDuration.price_per_player * manualForm.numPlayers : 0;

  return (
    <div className="space-y-8">
      {/* Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 bg-[#13131A] p-2 rounded-[12px] border border-[#1E1E2E]">
          <button type="button" onClick={goToPrevDay} className="p-2 text-[#00FFCC] hover:bg-white/5 rounded-[8px] transition-all"><ChevronLeft /></button>
          <span className="font-bold text-sm min-w-[100px] text-center">{toDateStr(currentDate)}</span>
          <button type="button" onClick={goToNextDay} className="p-2 text-[#00FFCC] hover:bg-white/5 rounded-[8px] transition-all"><ChevronRight /></button>
        </div>
        <button type="button" onClick={goToToday} className="px-5 py-2.5 rounded-[8px] border border-[#1E1E2E] text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all">Today</button>
      </div>

      {loading ? (
        <div className="flex justify-center p-20 text-[#00FFCC]"><Loader2 className="animate-spin" size={48} /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {slotGrid.map((slot, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (slot.status === 'booked' && slot.booking) {
                  setSelectedBooking(slot.booking);
                } else if (slot.status === 'available') {
                  setSelectedSlotTime(slot.time);
                  setShowManualModal(true);
                  setManualError(null);
                }
              }}
              className={`p-4 rounded-[12px] border transition-all text-center flex flex-col items-center justify-center gap-1 ${
                slot.status === 'booked' ? 'bg-[#FF3B3B]/10 border-[#FF3B3B]/30 hover:bg-[#FF3B3B]/20' :
                slot.status === 'blocked' ? 'bg-white/5 border-[#1E1E2E] cursor-not-allowed opacity-50' :
                'bg-[#00FFCC]/5 border-[#00FFCC]/20 hover:bg-[#00FFCC]/10'
              }`}
            >
              <span className="text-lg font-black tracking-tight text-white">{slot.displayTime}</span>
              <span className={`text-[9px] uppercase font-bold tracking-widest ${
                slot.status === 'booked' ? 'text-[#FF3B3B]' : 
                slot.status === 'blocked' ? 'text-[#A0A0B8]' : 
                'text-[#00FFCC]'
              }`}>
                {slot.status === 'booked' ? 'Booked' : 
                 slot.status === 'blocked' ? 'Blocked' : 
                 'Available'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Debug Panel */}
      <div style={{ 
        padding: '12px', 
        backgroundColor: '#1a1a2e',
        marginTop: '16px',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#A0A0B8'
      }}>
        <div>Date: {toDateStr(currentDate)}</div>
        <div>Total bookings: {bookings.length}</div>
        <div>Confirmed: {confirmedBookings.length}</div>
        <div>Blocks: {blocks.length}</div>
        <div>Grid: {slotGrid.map(s => s.time + ':' + s.status).join(', ')}</div>
      </div>

      {/* Manual Booking Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70" onClick={() => !isSubmitting && setShowManualModal(false)} />
          <div className="relative bg-[#13131A] rounded-[16px] p-8 max-w-[480px] w-[90%] border border-[#1E1E2E] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">New Booking — {selectedSlotTime}</h3>
              <button type="button" onClick={() => setShowManualModal(false)} className="text-[#A0A0B8] hover:text-white"><X size={20} /></button>
            </div>

            {manualError && (
              <div className="mb-6 p-4 bg-[#FF3B3B]/10 border border-[#FF3B3B]/20 rounded-[8px] flex items-start gap-3">
                <AlertCircle className="text-[#FF3B3B] shrink-0" size={18} />
                <p className="text-xs text-[#FF3B3B] font-bold">{manualError}</p>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#A0A0B8] uppercase tracking-wider">Full Name</label>
                <input 
                  type="text" 
                  value={manualForm.customerName}
                  onChange={(e) => setManualForm({...manualForm, customerName: e.target.value})}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white rounded-[8px] px-3.5 py-2.5 text-sm focus:border-[#00FFCC] outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#A0A0B8] uppercase tracking-wider">Phone Number</label>
                <input 
                  type="text" 
                  value={manualForm.customerPhone}
                  onChange={(e) => setManualForm({...manualForm, customerPhone: e.target.value})}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white rounded-[8px] px-3.5 py-2.5 text-sm focus:border-[#00FFCC] outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-[#A0A0B8] uppercase tracking-wider">Email (Optional)</label>
                <input 
                  type="email" 
                  value={manualForm.customerEmail}
                  onChange={(e) => setManualForm({...manualForm, customerEmail: e.target.value})}
                  className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white rounded-[8px] px-3.5 py-2.5 text-sm focus:border-[#00FFCC] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#A0A0B8] uppercase tracking-wider">Game Type</label>
                  <select 
                    value={manualForm.gameName}
                    onChange={(e) => setManualForm({...manualForm, gameName: e.target.value, durationId: ''})}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white rounded-[8px] px-3.5 py-2.5 text-sm focus:border-[#00FFCC] outline-none transition-all appearance-none"
                  >
                    <option value="">Select Game</option>
                    {uniqueGameNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#A0A0B8] uppercase tracking-wider">Duration</label>
                  <select 
                    value={manualForm.durationId}
                    onChange={(e) => setManualForm({...manualForm, durationId: e.target.value})}
                    disabled={!manualForm.gameName}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white rounded-[8px] px-3.5 py-2.5 text-sm focus:border-[#00FFCC] outline-none transition-all appearance-none disabled:opacity-30"
                  >
                    <option value="">Select Duration</option>
                    {filteredDurations.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.duration_minutes} min — {d.price_per_player} EGP
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#A0A0B8] uppercase tracking-wider">Players</label>
                  <input 
                    type="number" 
                    min="1" 
                    max="6"
                    value={manualForm.numPlayers}
                    onChange={(e) => setManualForm({...manualForm, numPlayers: parseInt(e.target.value)})}
                    className="w-full bg-[#0A0A0F] border border-[#1E1E2E] text-white rounded-[8px] px-3.5 py-2.5 text-sm focus:border-[#00FFCC] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-[#A0A0B8] uppercase tracking-wider">Total Price</label>
                  <div className="w-full bg-[#0A0A0F] border border-[#1E1E2E]/50 text-[#00FFCC] rounded-[8px] px-3.5 py-2.5 text-lg font-black">
                    {calculatedTotal} EGP
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <button 
                  type="button"
                  onClick={handleManualSubmit}
                  disabled={isSubmitting}
                  className="w-full bg-[#FF3B3B] text-white py-3 rounded-[8px] font-bold uppercase tracking-widest text-xs hover:bg-[#FF3B3B]/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Confirm Booking'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowManualModal(false)}
                  className="w-full border border-[#1E1E2E] text-[#A0A0B8] py-3 rounded-[8px] font-bold uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail Panel */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSelectedBooking(null)} />
          <div className="relative w-full max-md:max-w-full max-w-md h-full bg-[#13131A] border-l border-[#1E1E2E] p-8 overflow-y-auto">
            <div className="flex justify-between items-start mb-10">
              <div>
                <h3 className="text-2xl font-black text-[#00FFCC] uppercase tracking-tighter">Mission Intel</h3>
                <p className="text-xs text-[#A0A0B8] font-bold mt-1 uppercase tracking-widest">WA CODE: {selectedBooking.booking_code}</p>
              </div>
              <button type="button" onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-white/5 rounded-[8px] text-[#A0A0B8]"><X /></button>
            </div>

            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-[#A0A0B8] tracking-[0.2em] border-b border-[#1E1E2E] pb-2 block">Customer Details</label>
                <div className="flex items-center gap-4 text-sm font-bold text-white"><User className="text-[#00FFCC]" size={18} /> {selectedBooking.customer_name}</div>
                <div className="flex items-center gap-4 text-sm font-bold text-white"><Phone className="text-[#00FFCC]" size={18} /> {selectedBooking.customer_phone}</div>
                <div className="flex items-center gap-4 text-sm font-bold text-white"><Mail className="text-[#00FFCC]" size={18} /> {selectedBooking.customer_email || 'N/A'}</div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-[#A0A0B8] tracking-[0.2em] border-b border-[#1E1E2E] pb-2 block">Protocol Breakdown</label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#0A0A0F] p-4 rounded-[12px] border border-[#1E1E2E]">
                    <p className="text-[9px] font-black uppercase text-[#A0A0B8] mb-1">Game</p>
                    <p className="font-bold text-xs flex items-center gap-2 text-white"><Target size={14} className="text-[#00FFCC]" /> {selectedBooking.gameName}</p>
                  </div>
                  <div className="bg-[#0A0A0F] p-4 rounded-[12px] border border-[#1E1E2E]">
                    <p className="text-[9px] font-black uppercase text-[#A0A0B8] mb-1">Squad Size</p>
                    <p className="font-bold text-xs flex items-center gap-2 text-white"><Users size={14} className="text-[#00FFCC]" /> {selectedBooking.num_players} Units</p>
                  </div>
                </div>
                <div className="bg-[#00FFCC]/10 p-4 rounded-[12px] border border-[#00FFCC]/20 flex justify-between items-center">
                  <p className="text-[10px] font-black uppercase text-[#00FFCC]">Revenue Captured</p>
                  <p className="font-black text-[#00FFCC] text-lg">{selectedBooking.total_price} EGP</p>
                </div>
              </div>

              <div className="pt-10 flex flex-col gap-4">
                <button 
                  type="button"
                  onClick={() => handleCancel(selectedBooking.id)} 
                  className="w-full bg-[#FF3B3B] text-white py-4 rounded-[8px] font-black uppercase tracking-widest text-xs hover:bg-[#FF3B3B]/90 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} /> Cancel Reservation
                </button>
                <button type="button" onClick={() => setSelectedBooking(null)} className="w-full text-[#A0A0B8] font-bold uppercase tracking-widest text-[10px] py-4 text-center hover:text-white transition-all">Close Panel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
