-- SQL Script to create the holidays table in Supabase
-- Paste this script into the Supabase SQL Editor and run it.

CREATE TABLE IF NOT EXISTS holidays (
    id SERIAL PRIMARY KEY,
    holiday_date DATE UNIQUE NOT NULL,
    holiday_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert 2026 default holidays
INSERT INTO holidays (holiday_date, holiday_name) VALUES
('2026-01-01', 'New Year''s Day'),
('2026-01-15', 'Pongal'),
('2026-01-16', 'Thiruvalluvar Day'),
('2026-01-17', 'Uzhavar Thirunal'),
('2026-01-26', 'Republic Day'),
('2026-02-01', 'Thai Poosam'),
('2026-03-19', 'Telugu New Year''s Day'),
('2026-03-21', 'Ramzan (Id-ul-Fitr)'),
('2026-03-31', 'Mahavir Jayanti'),
('2026-04-03', 'Good Friday'),
('2026-04-14', 'Tamil New Year / Dr. Ambedkar Jayanti'),
('2026-05-01', 'May Day'),
('2026-05-28', 'Bakrid (Id-ul-Zuha)'),
('2026-06-26', 'Muharram'),
('2026-08-15', 'Independence Day'),
('2026-08-26', 'Milad-un-Nabi'),
('2026-09-04', 'Krishna Jayanti'),
('2026-09-14', 'Vinayakar Chathurthi'),
('2026-10-02', 'Gandhi Jayanti'),
('2026-10-18', 'Ayutha Pooja'),
('2026-10-19', 'Vijaya Dashami'),
('2026-11-08', 'Deepavali'),
('2026-12-25', 'Christmas Day')
ON CONFLICT (holiday_date) DO NOTHING;
