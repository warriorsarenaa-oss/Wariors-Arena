import { supabaseAdmin } from './supabase';

export interface SlotInfo {
  time24h: string;
  displayTime: string;
  isAvailable: boolean;
}

export interface BookingData {
  gameTypeId: string;
  durationId: string;
  date: string;
  slotTime: string;
  slotEndTime: string;
  numPlayers: number;
  totalPrice: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  bookingCode: string;
}

export function formatSlotDisplay(time24h: string): string {
  const [hoursStr, minutes] = time24h.split(':');
  let hours = parseInt(hoursStr, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function generateBookingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'WA-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function addMinutesToTime(time24h: string, minutesToAdd: number): string {
  const [h, m] = time24h.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutesToAdd;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

export function parseTimeToMinutes(time24h: string): number {
  const parts = time24h.split(':');
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export async function getWorkingHoursForDate(date: Date): Promise<string[]> {
  const dateString = date.toISOString().split('T')[0];
  const dayOfWeek = date.getDay();

  console.log('[SlotEngine] Processing date:', dateString, 'day_of_week:', dayOfWeek);

  // Fetch ALL rows to prevent NULL query issues
  const { data, error } = await supabaseAdmin
    .from('working_hours_config')
    .select('*');

  if (error) {
    console.error('[SlotEngine] Supabase ERROR:', error);
    // Attach error to a global for the route to find? No, just log.
    return [];
  }

  if (!data || data.length === 0) {
    console.warn('[SlotEngine] Table working_hours_config is EMPTY');
    return [];
  }

  console.log('[SlotEngine] Found rows count:', data.length);
  // Priority 1: Specific Date
  const specificMatch = data.find(r => r.is_active && r.specific_date === dateString);
  if (specificMatch) {
    console.log('[SlotEngine] Result: Found Specific Date match');
    return specificMatch.slots || [];
  }

  // Priority 2: Day of Week
  const dayMatch = data.find(r => r.is_active && r.day_of_week === dayOfWeek && !r.specific_date);
  if (dayMatch) {
    console.log('[SlotEngine] Result: Found Day of Week match');
    return dayMatch.slots || [];
  }

  // Priority 3: Global Default (both NULL)
  const defaultMatch = data.find(r => r.is_active && r.day_of_week === null && r.specific_date === null);
  if (defaultMatch) {
    console.log('[SlotEngine] Result: Found Global Default match');
    return defaultMatch.slots || [];
  }

  console.warn('[SlotEngine] No matching config row found in', data.length, 'rows');
  return [];
}

export async function getBookedRangesForDate(date: Date): Promise<Array<{start: string, end: string}>> {
  const dateString = date.toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('slot_time, slot_end_time')
    .eq('booking_date', dateString)
    .eq('status', 'confirmed');
    
  if (error || !data) return [];
  
  return data.map(b => ({
    start: b.slot_time.substring(0, 5), 
    end: b.slot_end_time.substring(0, 5)
  }));
}

export async function getAvailableSlots(
  date: Date, 
  gameType: 'laser_tag' | 'gel_blasters', 
  durationMinutes: 30 | 60,
  _supabase?: unknown
): Promise<SlotInfo[]> {
  const dateString = date.toISOString().split('T')[0];
  
  const workingHours = await getWorkingHoursForDate(date);
  
  if (workingHours.length === 0) {
    return [];
  }

  const bookedRanges = await getBookedRangesForDate(date);
  
  const { data: blocks } = await supabaseAdmin
    .from('manual_blocks')
    .select('slot_time, slot_end_time')
    .eq('block_date', dateString);
  
  const blockRanges = (blocks || []).map(b => ({
    start: b.slot_time.substring(0, 5),
    end: b.slot_end_time.substring(0, 5)
  }));

  const allConflicts = [...bookedRanges, ...blockRanges];

  return workingHours.map(slotStartTime => {
    const slotStartMins = parseTimeToMinutes(slotStartTime);
    const slotEndMins = slotStartMins + durationMinutes;

    let isAvailable = true;

    for (const conflict of allConflicts) {
      const conflictStartMins = parseTimeToMinutes(conflict.start);
      const conflictEndMins = parseTimeToMinutes(conflict.end);

      if (conflictStartMins < slotEndMins && conflictEndMins > slotStartMins) {
        isAvailable = false;
        break;
      }
    }
    
    if (isAvailable && durationMinutes === 60) {
        const nextSlotStart = addMinutesToTime(slotStartTime, 30);
        if (!workingHours.includes(nextSlotStart)) {
             isAvailable = false;
        }
    }

    const now = new Date();
    const localDateStr = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0')
    ].join('-');

    if (dateString === localDateStr) {
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (slotStartMins <= currentMins) {
        isAvailable = false;
      }
    }

    return {
      time24h: slotStartTime,
      displayTime: formatSlotDisplay(slotStartTime),
      isAvailable
    };
  });
}
