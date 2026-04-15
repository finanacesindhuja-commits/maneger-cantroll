-- ADD PLAN_ID AND PLAN_NAME TO TRACK MULTI-WEEK SCHEDULES
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

ALTER TABLE collection_schedules 
ADD COLUMN IF NOT EXISTS plan_id TEXT,
ADD COLUMN IF NOT EXISTS plan_name TEXT;

-- Index for faster grouping
CREATE INDEX IF NOT EXISTS idx_plan_id ON collection_schedules(plan_id);
