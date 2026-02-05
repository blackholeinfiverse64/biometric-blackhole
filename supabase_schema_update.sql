-- Add daily_records column to manual_users table for storing daily attendance records
ALTER TABLE public.manual_users 
ADD COLUMN IF NOT EXISTS daily_records JSONB DEFAULT '[]'::jsonb;

