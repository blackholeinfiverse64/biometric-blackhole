-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Reports table
CREATE TABLE IF NOT EXISTS public.attendance_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  daily_report JSONB NOT NULL,
  monthly_summary JSONB NOT NULL,
  statistics JSONB NOT NULL,
  output_file TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- Manual Users table
CREATE TABLE IF NOT EXISTS public.manual_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  total_hours DECIMAL(10, 2) NOT NULL,
  hour_rate DECIMAL(10, 2),
  present_days INTEGER DEFAULT 0,
  absent_days INTEGER DEFAULT 0,
  auto_assigned_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, employee_id)
);

-- Confirmed Salaries table
CREATE TABLE IF NOT EXISTS public.confirmed_salaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL,
  employee_name TEXT NOT NULL,
  total_hours DECIMAL(10, 2) NOT NULL,
  hour_rate DECIMAL(10, 2) NOT NULL,
  salary DECIMAL(10, 2) NOT NULL,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Finalized Salaries table
CREATE TABLE IF NOT EXISTS public.finalized_salaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL, -- e.g., "January 2026"
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  employees JSONB NOT NULL,
  total_salary DECIMAL(10, 2) NOT NULL,
  finalized_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_key)
);

-- Hour Rates table
CREATE TABLE IF NOT EXISTS public.hour_rates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL,
  hour_rate DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, employee_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_reports_user_id ON public.attendance_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_manual_users_user_id ON public.manual_users(user_id);
CREATE INDEX IF NOT EXISTS idx_confirmed_salaries_user_id ON public.confirmed_salaries(user_id);
CREATE INDEX IF NOT EXISTS idx_finalized_salaries_user_id ON public.finalized_salaries(user_id);
CREATE INDEX IF NOT EXISTS idx_hour_rates_user_id ON public.hour_rates(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmed_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finalized_salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hour_rates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only access their own data)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own attendance reports" ON public.attendance_reports
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own manual users" ON public.manual_users
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own confirmed salaries" ON public.confirmed_salaries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own finalized salaries" ON public.finalized_salaries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own hour rates" ON public.hour_rates
  FOR ALL USING (auth.uid() = user_id);

