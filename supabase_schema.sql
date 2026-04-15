-- SUPABASE SQL SCHEMA FOR WARRIORS ARENA
-- Run this directly in the Supabase SQL Editor

-- 1. Enable Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create Tables
CREATE TABLE game_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  display_name_en text NOT NULL,
  display_name_ar text NOT NULL,
  description_en text,
  description_ar text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE game_durations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_type_id uuid REFERENCES game_types(id) ON DELETE CASCADE,
  duration_minutes integer NOT NULL CHECK (duration_minutes IN (30, 60)),
  price_per_player integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE working_hours_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  specific_date date,
  slots jsonb NOT NULL,
  is_active boolean DEFAULT true,
  note text,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code text UNIQUE NOT NULL,
  game_type_id uuid REFERENCES game_types(id) ON DELETE SET NULL,
  duration_id uuid REFERENCES game_durations(id) ON DELETE SET NULL,
  booking_date date NOT NULL,
  slot_time time NOT NULL,
  slot_end_time time NOT NULL,
  num_players integer NOT NULL CHECK (num_players BETWEEN 1 AND 6),
  total_price integer NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'blocked')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE manual_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_date date NOT NULL,
  slot_time time NOT NULL,
  slot_end_time time NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 3. Create Indexes
CREATE INDEX idx_bookings_date_slot_status ON bookings(booking_date, slot_time, status);
CREATE INDEX idx_bookings_phone ON bookings(customer_phone);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_manual_blocks_date_slot ON manual_blocks(block_date, slot_time);
CREATE INDEX idx_working_hours_specific_date ON working_hours_config(specific_date);
CREATE INDEX idx_working_hours_day_of_week ON working_hours_config(day_of_week);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE game_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_durations ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_hours_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- game_types: SELECT allowed for all
CREATE POLICY "game_types_select_all" ON game_types FOR SELECT USING (true);

-- game_durations: SELECT allowed for all
CREATE POLICY "game_durations_select_all" ON game_durations FOR SELECT USING (true);

-- working_hours_config: SELECT allowed for all (INSERT/UPDATE/DELETE are natively restricted to service_role with bypass_rls)
CREATE POLICY "working_hours_config_select_all" ON working_hours_config FOR SELECT USING (true);

-- bookings: INSERT allowed for all/anon, SELECT/UPDATE/DELETE restricted to service_role natively
CREATE POLICY "bookings_insert_anon" ON bookings FOR INSERT WITH CHECK (true);

-- (manual_blocks and admin_sessions do not need anon policies as they are fully locked down to service_role)

-- 6. Seed Data
INSERT INTO game_types (name, display_name_en, display_name_ar, description_en, description_ar)
VALUES 
  ('laser_tag', 'Laser Tag', 'لايزر تاج', 'High-intensity laser combat experience', 'تجربة قتال بالليزر عالية الكثافة'),
  ('gel_blasters', 'Gel Blasters', 'جيل بلاسترز', 'High-speed gel ball shooter battle', 'معركة بندقية كرات الجيل عالية السرعة');

DO $$
DECLARE
  lt_id uuid;
  gb_id uuid;
BEGIN
  SELECT id INTO lt_id FROM game_types WHERE name = 'laser_tag';
  SELECT id INTO gb_id FROM game_types WHERE name = 'gel_blasters';

  INSERT INTO game_durations (game_type_id, duration_minutes, price_per_player)
  VALUES 
    (lt_id, 30, 150),
    (lt_id, 60, 300),
    (gb_id, 30, 100);
END $$;

INSERT INTO working_hours_config (day_of_week, slots, is_active, note)
VALUES 
  (NULL, '["18:00","18:30","19:00","19:30","20:00","20:30"]'::jsonb, true, 'Default schedule 6PM-9PM');

-- 7. Postgres Function: Atomic claim_slot
CREATE OR REPLACE FUNCTION claim_slot(
  p_date date,
  p_slot_time time,
  p_end_time time,
  p_booking_data jsonb
) RETURNS jsonb AS $$
DECLARE
  v_booking_code text;
  v_conflict_booking boolean;
  v_conflict_manual boolean;
  v_new_booking record;
BEGIN
  -- We use pg_try_advisory_xact_lock to ensure an absolute lock on this date & time to prevent
  -- phantom reads in simultaneous transactions, augmenting FOR UPDATE SKIP LOCKED
  IF NOT pg_try_advisory_xact_lock(hashtext(p_date::text || p_slot_time::text) + 1) THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE';
  END IF;

  -- 3. Check for overlapping confirmed bookings (atomically skipping locked rows if any)
  SELECT EXISTS (
    SELECT 1 FROM bookings 
    WHERE booking_date = p_date 
      AND status IN ('confirmed', 'blocked')
      AND slot_time < p_end_time 
      AND slot_end_time > p_slot_time
    FOR UPDATE SKIP LOCKED
  ) INTO v_conflict_booking;

  IF v_conflict_booking THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE';
  END IF;

  -- 4. Check for manual blocks
  SELECT EXISTS (
    SELECT 1 FROM manual_blocks
    WHERE block_date = p_date
      AND slot_time < p_end_time
      AND slot_end_time > p_slot_time
  ) INTO v_conflict_manual;

  IF v_conflict_manual THEN
    RAISE EXCEPTION 'SLOT_UNAVAILABLE';
  END IF;

  -- Generate unique booking code
  v_booking_code := 'WA-' || upper(substr(md5(random()::text), 1, 6));

  -- 5. INSERT the booking
  INSERT INTO bookings (
    booking_code,
    game_type_id,
    duration_id,
    booking_date,
    slot_time,
    slot_end_time,
    num_players,
    total_price,
    customer_name,
    customer_phone,
    customer_email
  ) VALUES (
    v_booking_code,
    (p_booking_data->>'game_type_id')::uuid,
    (p_booking_data->>'duration_id')::uuid,
    p_date,
    p_slot_time,
    p_end_time,
    (p_booking_data->>'num_players')::integer,
    (p_booking_data->>'total_price')::integer,
    p_booking_data->>'customer_name',
    p_booking_data->>'customer_phone',
    p_booking_data->>'customer_email'
  ) RETURNING * INTO v_new_booking;

  -- Return the inserted booking as jsonb
  RETURN row_to_json(v_new_booking)::jsonb;
END;
$$ LANGUAGE plpgsql;
