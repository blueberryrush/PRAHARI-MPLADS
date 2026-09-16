import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://alimjhdhmkoyyaukyhzf.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFsaW1qaGRobWtveXlhdWt5aHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzU5MTMsImV4cCI6MjEwNDgxMTkxM30.-VMyWvY0EItnc3-S3Ws43fH-AqcIlgVdDtlt-MhaveA';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
