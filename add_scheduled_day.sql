-- ADD WEEKDAY TRACKING TO DASHBOARD
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add scheduled_day column to store 'Monday', 'Tuesday', etc.
ALTER TABLE collection_schedules 
ADD COLUMN IF NOT EXISTS scheduled_day TEXT;

-- 2. Populate existing rows with their weekday name
UPDATE collection_schedules
SET scheduled_day = TRIM(to_char(scheduled_date, 'Day'))
WHERE scheduled_day IS NULL;
