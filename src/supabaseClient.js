import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lnwowenaunppsrqdewki.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxud293ZW5hdW5wcHNycWRld2tpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MzYxMDAsImV4cCI6MjA3OTUxMjEwMH0.HhWUOlZfqRKg_I1e0DPdhMGL2tKiXRksi-H_n_fxJGY";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
