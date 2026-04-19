import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트 설정
const SUPABASE_URL = 'https://bqkujvvlccgutscncnfo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxa3VqdnZsY2NndXRzY25jbmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwODQ0MjEsImV4cCI6MjA5MTY2MDQyMX0.ndnrM658mrdfnrqeNBrq-TvVjzASyJf4ZXRBrIy5r5Y';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
