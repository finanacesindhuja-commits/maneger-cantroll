-- UPDATE COLLECTION SYSTEM FOR WEEKDAY TRACKING
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add scheduled_day column if it doesn't exist
ALTER TABLE collection_schedules 
ADD COLUMN IF NOT EXISTS scheduled_day TEXT;

-- 2. (Optional) Run an update to populate existing rows
UPDATE collection_schedules
SET scheduled_day = TRIM(to_char(scheduled_date, 'Day'))
WHERE scheduled_day IS NULL;
