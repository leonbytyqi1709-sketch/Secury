/**
 * Secury Auth Module
 * Registrierung, Login, Logout und Session Management
 */

const Auth = {
    /**
     * Registriert einen neuen Benutzer und leitet direkt den Krypto-Schlüssel ab
     */
    register: async function(email, password) {
        try {
            // Mit Supabase registrieren
            const { data, error } = await window.supabaseClient.auth.signUp({
                email: email,
                password: password
            });

            if (error) throw error;
            
            // Sofort Schlüssel ableiten, damit das Setupprozedere klappt
            await window.Crypto.deriveKey(password, email);
            
            return { success: true, data };
        } catch (error) {
            console.error("Registrierung fehlgeschlagen:", error.message);
            throw error;
        }
    },

    /**
     * Meldet einen Benutzer an und leitet den Krypto-Schlüssel ab
     */
    login: async function(email, password) {
        try {
            const { data, error } = await window.supabaseClient.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            // Kryptoschlüssel aus dem normalen Passwort ableiten
            // Wir nutzen die Email als Salt für PBKDF2
            await window.Crypto.deriveKey(password, email);

            return { success: true, data };
        } catch (error) {
            console.error("Login fehlgeschlagen:", error.message);
            throw error;
        }
    },

    /**
     * Meldet den Benutzer ab
     */
    logout: async function() {
        try {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) throw error;

            // Sicherstellen, dass der Key aus dem RAM gelöscht wird!
            window.Crypto.clearKey();

            // Redirect zu Login
            window.location.href = 'login.html';
        } catch (error) {
            console.error("Logout fehlgeschlagen:", error.message);
            throw error;
        }
    },

    /**
     * Prüft die aktuelle Session
     */
    checkSession: async function(requireLogin = true, requireKey = true) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (requireLogin && !session) {
            window.location.href = 'login.html';
            return null;
        }

        // Versuche den Key nach einem Seitenwechsel aus dem SessionStorage zu laden
        await window.Crypto.restoreKey();

        if (requireLogin && session && requireKey && !window.Crypto.isKeyLoaded()) {
            // Nutzer ist eingeloggt, hat aber keinen Key im RAM (z.B. nach Page Reload)
            alert("Sitzung gesperrt. Bitte Master-Passwort erneut eingeben.");
            this.logout();
            return null;
        }

        return session;
    },
    
    /**
     * Gibt aktuellen User zurück
     */
    getUser: async function() {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        return user;
    }
};

window.Auth = Auth;
