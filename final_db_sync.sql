-- FINAL DATABASE SYNC
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add scheduled_day column (for kizhama/weekday)
ALTER TABLE collection_schedules 
ADD COLUMN IF NOT EXISTS scheduled_day TEXT;

-- 2. Add amount column (for ₹10k-₹20k)
ALTER TABLE collection_schedules 
ADD COLUMN IF NOT EXISTS amount NUMERIC;

-- 3. Update existing rows for scheduled_day
UPDATE collection_schedules
SET scheduled_day = TRIM(to_char(scheduled_date, 'Day'))
WHERE scheduled_day IS NULL;
