import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Log environment variables (remove in production)
if (import.meta.env.DEV) {
  console.log('Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  console.error('Make sure .env file exists in frontend/ directory')
  console.error('And restart your dev server after creating .env')
  throw new Error('Missing Supabase environment variables. Please create frontend/.env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

