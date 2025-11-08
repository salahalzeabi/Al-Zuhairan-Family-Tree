import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nblqlcizjjsyjqwxuigi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ibHFsY2l6ampzeWpxd3h1aWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjU1NzAsImV4cCI6MjA3ODIwMTU3MH0.7LjEXty1nAcjosFJEr6xnjUCnb4odsdkMeSUaSWkQME';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);