import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const DB_SCHEMA = import.meta.env.VITE_DB_SCHEMA;

// Kiple external Supabase project client
// Use this client to interact with the Kiple project database
export const kipledDb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  db: { schema: DB_SCHEMA }
});
