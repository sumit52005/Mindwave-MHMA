const SUPABASE_URL = 'https://ghrpiycobkntvjfvuzkc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdocnBpeWNvYmtudHZqZnZ1emtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzA2NjAsImV4cCI6MjA3ODUwNjY2MH0.RXbKDBTQW8u1G0QDWIqS-T4iB6kXBZQjsC-MWkWcDRc';

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log("🔵 Supabase client created:", window.supabase);
