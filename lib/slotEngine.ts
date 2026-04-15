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

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
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
  const mins = timeToMinutes(time24h);
  return minutesToTime(mins + minutesToAdd);
}

export async function getWorkingHoursForDate(date: Date): Promise<string[]> {
  const dateStr = toLocalDateString(date);
  const dayOfWeek = date.getDay();

  const { data, error } = await supabaseAdmin
    .from('working_hours_config')
    .select('*')
    .eq('is_active', true);

  if (error || !data || data.length === 0) return [];

  const specificMatch = data.find(r => r.specific_date === dateStr);
  if (specificMatch) return specificMatch.slots || [];

  const dayMatch = data.find(r => r.day_of_week === dayOfWeek && !r.specific_date);
  if (dayMatch) return dayMatch.slots || [];

  const defaultMatch = data.find(r => r.day_of_week === null && r.specific_date === null);
  if (defaultMatch) return defaultMatch.slots || [];

  return [];
}

export async function getBookedRangesForDate(date: Date): Promise<Array<{start: string, end: string}>> {
  const dateStr = toLocalDateString(date);
  
  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('slot_time, slot_end_time')
    .eq('booking_date', dateStr)
    .eq('status', 'confirmed');

  console.log('[SlotEngine] Querying bookings for date:', 
    dateStr, '- found:', data?.length, 'bookings');

  if (error || !data) return [];
  
  return data.map(b => ({
    start: b.slot_time.substring(0, 5),
    end: b.slot_end_time.substring(0, 5)
  }));
}

export async function getAvailableSlots(
  date: Date, 
  gameType: 'laser_tag' | 'gel_blasters', 
  durationMinutes: 30 | 60
): Promise<SlotInfo[]> {
  const dateStr = toLocalDateString(date);
  const workingHours = await getWorkingHoursForDate(date);
  
  if (workingHours.length === 0) return [];

  const bookedRanges = await getBookedRangesForDate(date);
  
  const { data: blocks } = await supabaseAdmin
    .from('manual_blocks')
    .select('slot_time, slot_end_time')
    .eq('block_date', dateStr);
  
  const blockRanges = (blocks || []).map(b => ({
    start: b.slot_time.substring(0, 5),
    end: b.slot_end_time.substring(0, 5)
  }));

  const allConflicts = [...bookedRanges, ...blockRanges];

  return workingHours.map(slotStart => {
    const slotStartMins = timeToMinutes(slotStart);
    const slotEndMins = slotStartMins + durationMinutes;

    let isAvailable = true;
    let conflictingRanges: any[] = [];

    for (const conflict of allConflicts) {
      const conflictStartMins = timeToMinutes(conflict.start);
      // Ensure we only have HH:MM
      const conflictEndClean = conflict.end.includes(':') && conflict.end.split(':').length > 2 
        ? conflict.end.substring(0, 5) 
        : conflict.end;
      const conflictEndMins = timeToMinutes(conflictEndClean);

      // Overlap condition: bookedStart < slotEnd AND bookedEnd > slotStart
      if (conflictStartMins < slotEndMins && conflictEndMins > slotStartMins) {
        isAvailable = false;
        conflictingRanges.push(conflict);
      }
    }

    console.log('[SlotEngine] Slot', slotStart, '- available:', 
      isAvailable, '- conflicts:', conflictingRanges);

    // Business rule: 60 min slots require the next 30 min slot to exist in config
    if (isAvailable && durationMinutes === 60) {
        const nextSlotStart = addMinutesToTime(slotStart, 30);
        if (!workingHours.includes(nextSlotStart)) {
             isAvailable = false;
        }
    }

    // Business rule: Cannot book slots in the past
    const now = new Date();
    const localDateStr = toLocalDateString(now);

    if (dateStr === localDateStr) {
      const currentMins = now.getHours() * 60 + now.getMinutes();
      if (slotStartMins <= currentMins) {
        isAvailable = false;
      }
    }

    return {
      time24h: slotStart,
      displayTime: formatSlotDisplay(slotStart),
      isAvailable
    };
  });
}
