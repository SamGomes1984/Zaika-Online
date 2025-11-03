import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project credentials
// Get these from your Supabase project settings at https://supabase.com/dashboard/project/_/settings/api
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nktifqwqqkwhypyefjwr.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rdGlmcXdxcWt3aHlweWVmandyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0NjI5OTMsImV4cCI6MjA3NzAzODk5M30.AAG1atfE0pTpbvY43WenmIMRlpCPXF4Qt5Wuf66_k-U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: localStorage,
  },
});
