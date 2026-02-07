
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pfjatkbinktdwrbeglty.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmamF0a2Jpbmt0ZHdyYmVnbHR5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0MTc1NDAsImV4cCI6MjA4NTk5MzU0MH0.ILXAjfj26SDGB4wL0X0ZYPylddcWdUVBRPJvZGv2Yks';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
