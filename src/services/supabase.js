import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://jdtuxrkzobelcawcikyv.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkdHV4cmt6b2JlbGNhd2Npa3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1NTI1MjQsImV4cCI6MjEwNDEyODUyNH0.O39W-QVtddZJD-n80flqLGWQoAdYtwZfciVGV5cnUYg";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
