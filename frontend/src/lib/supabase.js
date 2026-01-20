import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug: Log environment variables
if (import.meta.env.DEV) {
  console.log('🔍 Environment Check:')
  console.log('  Supabase URL:', supabaseUrl ? '✅ Set' : '❌ Missing')
  console.log('  Supabase Key:', supabaseAnonKey ? '✅ Set' : '❌ Missing')
  console.log('  All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))
}

// Check for missing environment variables
let supabase
let supabaseConfigured = false

if (!supabaseUrl || !supabaseAnonKey) {
  const errorMsg = import.meta.env.PROD 
    ? 'Missing Supabase environment variables in Vercel. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Dashboard → Settings → Environment Variables, then redeploy.'
    : 'Missing Supabase environment variables. Please create frontend/.env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY, then restart the dev server.'
  
  console.error('❌ Missing Supabase environment variables')
  console.error('Environment:', import.meta.env.MODE)
  console.error('Supabase URL:', supabaseUrl ? '✅' : '❌')
  console.error('Supabase Key:', supabaseAnonKey ? '✅' : '❌')
  console.error('Fix:', errorMsg)
  
  // In production, create a placeholder client to prevent app crash
  // The app will still render but Supabase features won't work
  if (import.meta.env.PROD) {
    console.error('⚠️ CRITICAL: Supabase not configured in Vercel!')
    console.error('⚠️ App will render but authentication will not work!')
    console.error('⚠️ Add environment variables in Vercel Dashboard and redeploy!')
    // Create a dummy client to prevent import errors
    // This allows the app to render and show the error message
    supabase = createClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    )
    supabaseConfigured = false
  } else {
    // In development, throw error to catch it early
    throw new Error(errorMsg)
  }
} else {
  // Everything is configured correctly
  supabase = createClient(supabaseUrl, supabaseAnonKey)
  supabaseConfigured = true
}

export { supabase, supabaseConfigured }
