import { getAvailableSlots, formatSlotDisplay, SlotInfo } from './slotEngine';
import { SupabaseClient } from '@supabase/supabase-js';

// Mocks to bypass actual Supabase DB calls during tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn()
  }))
}));

describe('formatSlotDisplay', () => {
  it('formats morning times properly', () => {
    expect(formatSlotDisplay('08:00')).toBe('8:00 AM');
    expect(formatSlotDisplay('11:30')).toBe('11:30 AM');
  });

  it('formats midday correctly', () => {
    expect(formatSlotDisplay('12:00')).toBe('12:00 PM');
    expect(formatSlotDisplay('12:30')).toBe('12:30 PM');
  });

  it('formats specific requested requirements correctly', () => {
    expect(formatSlotDisplay('18:00')).toBe('6:00 PM');
    expect(formatSlotDisplay('18:30')).toBe('6:30 PM');
    expect(formatSlotDisplay('20:00')).toBe('8:00 PM');
    expect(formatSlotDisplay('20:30')).toBe('8:30 PM');
    expect(formatSlotDisplay('00:00')).toBe('12:00 AM');
  });
});

describe('getAvailableSlots rules', () => {
  const dummyDate = new Date('2025-05-15T12:00:00Z'); // Future date to bypass "today" time limits

  // Create a mock configured supabase client per test
  const createMockSupabase = ({
    slots = ['18:00', '18:30', '19:00', '19:30', '20:00'],
    bookings = [] as { start_time: string, end_time: string }[],
    blocks = [] as { start_time: string, end_time: string }[]
  }) => {
    const mockFrom = jest.fn((table: string) => {
      if (table === 'working_hours_config') {
        return {
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue({
            data: [{ specific_date: null, day_of_week: null, is_active: true, slots }]
          })
        };
      }
      if (table === 'bookings') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          // Second eq resolves the promise with our requested data mock
          mockResolvedValue: jest.fn().mockResolvedValue({ data: bookings }),
        };
      }
      if (table === 'manual_blocks') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: blocks })
        };
      }
      return {};
    });

    // Provide the required fluent builder chains for tests
    const fromImplementation = (table: string) => {
      if (table === 'working_hours_config') {
        return {
          select: () => ({
            or: () => Promise.resolve({
              data: [{ day_of_week: null, specific_date: null, slots, is_active: true }],
              error: null
            })
          })
        };
      }
      if (table === 'bookings') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({
                data: bookings,
                error: null
              })
            })
          })
        }
      }
      if (table === 'manual_blocks') {
        return {
          select: () => ({
            eq: () => Promise.resolve({
              data: blocks,
              error: null
            })
          })
        }
      }
    };
    return { from: fromImplementation } as unknown as SupabaseClient;
  };

  it('A slot that is completely free should be available', async () => {
    const supabase = createMockSupabase({});
    const slots = await getAvailableSlots(dummyDate, 'laser_tag', 30);

    const targetSlot = slots.find(s => s.time24h === '18:00');
    expect(targetSlot?.isAvailable).toBe(true);
  });

  it('A slot exactly overlapped by an existing booking should be unavailable', async () => {
    const supabase = createMockSupabase({
      bookings: [{ start_time: '18:00:00', end_time: '18:30:00' }]
    });
    const slots = await getAvailableSlots(dummyDate, 'gel_blasters', 30);

    const check1800 = slots.find(s => s.time24h === '18:00');
    const check1830 = slots.find(s => s.time24h === '18:30');

    expect(check1800?.isAvailable).toBe(false); // Overlapped
    expect(check1830?.isAvailable).toBe(true);  // Does not overlap
  });

  it('A slot whose end time overlaps with an existing booking start should be unavailable', async () => {
    // Booking spans 18:30 to 19:30.
    // If user checks a 60-minute duration at 18:00 (ends 19:00), it should be unavailable.
    const supabase = createMockSupabase({
      bookings: [{ start_time: '18:30:00', end_time: '19:30:00' }]
    });
    const slots = await getAvailableSlots(dummyDate, 'laser_tag', 60);

    const check1800 = slots.find(s => s.time24h === '18:00');
    expect(check1800?.isAvailable).toBe(false);
  });

  it('A 60-min slot where only the second half is booked should be unavailable', async () => {
    // 18:30 to 19:00 is booked.
    // User wants 60 minutes from 18:00 to 19:00. The 2nd half overlaps!
    const supabase = createMockSupabase({
      bookings: [{ start_time: '18:30:00', end_time: '19:00:00' }]
    });
    const slots = await getAvailableSlots(dummyDate, 'laser_tag', 60);

    const check1800 = slots.find(s => s.time24h === '18:00');
    expect(check1800?.isAvailable).toBe(false);
  });
});
