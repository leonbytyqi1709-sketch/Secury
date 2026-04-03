/**
 * Secury Supabase Client
 * Initialisierung und Konstanten.
 * ACHTUNG: Ersetze die Platzhalter mit deinen tatsächlichen Supabase Projekt-Daten!
 */

const SUPABASE_URL = 'https://wkpglvvbyhwhvfoujjlu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrcGdsdnZieWh3aHZmb3Vqamx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxNDYyMTgsImV4cCI6MjA5MDcyMjIxOH0.LYb8kyfvqaBgW1PLuWqwnRAurg0Iz7V14QTmumc1I-c';

// Init Supabase Client (benötigt supabase-js Bibliothek im HTML)
let supabaseClient = null;

if (typeof window.supabase !== 'undefined') {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase Bibliothek nicht geladen. Bitte Skript in HTML einbinden.");
}

window.supabaseClient = supabaseClient;
