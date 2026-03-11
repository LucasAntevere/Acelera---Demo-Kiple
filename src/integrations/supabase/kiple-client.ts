import { createClient } from '@supabase/supabase-js';

const KIPLE_SUPABASE_URL = "https://npugwpifxpwymyecyyhe.supabase.co";
const KIPLE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wdWd3cGlmeHB3eW15ZWN5eWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNDcxMzksImV4cCI6MjA4ODgyMzEzOX0.OKqWD3hyG81US38EOOAX63S0pLk5MX7rdEDWKhNbc_k";

// Kiple external Supabase project client
// Use this client to interact with the Kiple project database
export const kipledDb = createClient(KIPLE_SUPABASE_URL, KIPLE_SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
