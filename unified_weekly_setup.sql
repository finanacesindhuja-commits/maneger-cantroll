-- UNIFIED WEEKLY COLLECTION SYSTEM UPGRADE
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Update CENTERS table to store their fixed meeting day
ALTER TABLE centers 
ADD COLUMN IF NOT EXISTS meeting_day TEXT;

-- 2. Update COLLECTION_SCHEDULES table to store the calculated weekday
ALTER TABLE collection_schedules 
ADD COLUMN IF NOT EXISTS scheduled_day TEXT;

-- 3. (Optional) Populate missing weekdays for existing schedules
UPDATE collection_schedules
SET scheduled_day = TRIM(to_char(scheduled_date, 'Day'))
WHERE scheduled_day IS NULL;

-- 4. Prevent duplicate schedules for the same center on the same date
-- This ensures one center can only have ONE schedule per day.
ALTER TABLE collection_schedules 
ADD CONSTRAINT unique_center_date UNIQUE (center_id, scheduled_date);
