import { createClient } from '@supabase/supabase-js'

// Use Vite's standard method to get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Create and export the Supabase client. This single object will be used everywhere.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
