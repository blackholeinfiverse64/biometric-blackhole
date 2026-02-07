-- Migration: Add paid_employees table to track payment status
-- Run this in your Supabase SQL Editor

-- Create paid_employees table
CREATE TABLE IF NOT EXISTS paid_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL, -- e.g., "January 2024"
  employee_ids TEXT[] DEFAULT '{}', -- Array of employee IDs that have been paid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, month_key)
);

-- Enable Row Level Security
ALTER TABLE paid_employees ENABLE ROW LEVEL SECURITY;

-- Create policies for paid_employees
CREATE POLICY "Users can view their own paid employees"
ON paid_employees FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own paid employees"
ON paid_employees FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paid employees"
ON paid_employees FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paid employees"
ON paid_employees FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_paid_employees_user_id ON paid_employees(user_id);
