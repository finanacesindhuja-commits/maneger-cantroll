-- WEEKLY COLLECTION SYSTEM UPGRADE
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. Add meeting_day to centers table
ALTER TABLE centers 
ADD COLUMN IF NOT EXISTS meeting_day TEXT;

-- 2. Add meeting_day to collection_schedules for consistency (already added as scheduled_day, but naming should be clear)
-- We'll keep scheduled_day as is, but centers will now have a 'source' day.

-- 3. (Optional) Populate some initial data if needed
-- UPDATE centers SET meeting_day = 'Monday' WHERE name ILIKE '%Monday%';
