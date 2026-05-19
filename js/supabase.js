/**
 * Secury Supabase Client
 * Initialisierung und Konstanten.
 * ACHTUNG: Ersetze die Platzhalter mit deinen tatsächlichen Supabase Projekt-Daten!
 */

const SUPABASE_URL = 'https://onbhxnjnzdnqttkeojsw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9uYmh4bmpuemRucXR0a2VvanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxODgxMzYsImV4cCI6MjA5NDc2NDEzNn0.K-dA9sr8_7JILmOBUg8uRoVTsH3XRMs4hIYo8y1Ts5c';

// Init Supabase Client (benötigt supabase-js Bibliothek im HTML)
let supabaseClient = null;

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase Bibliothek nicht geladen. Bitte Skript in HTML einbinden.");
}

window.supabaseClient = supabaseClient;
