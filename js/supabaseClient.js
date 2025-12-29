// Supabase Client Initialization (Global Scope)
const supabaseUrl = 'https://xdvnweeorbuqmrgbtxuu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhkdm53ZWVvcmJ1cW1yZ2J0eHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0ODgyMjksImV4cCI6MjA4MjA2NDIyOX0.VBK6Be32w89FRJDEu8ypBsSji12CuwxZVX2Jp-5LyXA';

// supabase is provided by the CDN script in index.html
if (window.supabase) {
    window.supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);
} else {
    console.error('Supabase SDK not loaded');
}
