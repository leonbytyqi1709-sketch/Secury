/**
 * Secury Vault Module
 * CRUD Operationen für Password-Einträge inkl. Ver-/Entschlüsselung
 */

const Vault = {
    /**
     * Ruft alle Einträge ab und entschlüsselt sie
     */
    getEntries: async function() {
        const user = await window.Auth.getUser();
        if (!user) throw new Error("Nicht eingeloggt");

        const { data, error } = await window.supabaseClient
            .from('password_entries')
            .select('*')
            .eq('user_id', user.id)
            .order('title', { ascending: true });

        if (error) throw error;

        // Entschlüsseln
        const decryptedEntries = [];
        for (const entry of data) {
            try {
                let ivs = {};
                try {
                    ivs = JSON.parse(entry.iv);
                } catch (e) {
                    // Fallback, falls nur ein IV vorhanden ist
                    ivs = { password: entry.iv, username: entry.iv, notes: entry.iv };
                }

                const decPassword = await window.Crypto.decrypt(entry.password, ivs.password);
                const decUsername = entry.username ? await window.Crypto.decrypt(entry.username, ivs.username) : '';
                const decNotes = entry.notes ? await window.Crypto.decrypt(entry.notes, ivs.notes) : '';

                decryptedEntries.push({
                    ...entry,
                    password: decPassword,
                    username: decUsername,
                    notes: decNotes
                });
            } catch (err) {
                console.error("Fehler beim Entschlüsseln von Eintrag", entry.id, err);
                // Behalten als fehlerhaft markierten Eintrag
                decryptedEntries.push({
                    ...entry,
                    _decryptionError: true
                });
            }
        }

        return decryptedEntries;
    },

    /**
     * Holt einen bestimmten Eintrag
     */
    getEntry: async function(id) {
        const { data, error } = await window.supabaseClient
            .from('password_entries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        let ivs = {};
        try {
            ivs = JSON.parse(data.iv);
        } catch (e) {
            ivs = { password: data.iv, username: data.iv, notes: data.iv };
        }

        const decPassword = await window.Crypto.decrypt(data.password, ivs.password);
        const decUsername = data.username ? await window.Crypto.decrypt(data.username, ivs.username) : '';
        const decNotes = data.notes ? await window.Crypto.decrypt(data.notes, ivs.notes) : '';

        return {
            ...data,
            password: decPassword,
            username: decUsername,
            notes: decNotes
        };
    },

    /**
     * Speichert einen neuen Eintrag
     */
    createEntry: async function(entryData) {
        const user = await window.Auth.getUser();
        if (!user) throw new Error("Nicht eingeloggt");

        // Verschlüsseln der sensiblen Felder
        const encPassword = await window.Crypto.encrypt(entryData.password);
        const encUsername = entryData.username ? await window.Crypto.encrypt(entryData.username) : null;
        const encNotes = entryData.notes ? await window.Crypto.encrypt(entryData.notes) : null;

        const ivs = {
            password: encPassword.iv,
            username: encUsername ? encUsername.iv : null,
            notes: encNotes ? encNotes.iv : null
        };

        const { data, error } = await window.supabaseClient
            .from('password_entries')
            .insert([{
                user_id: user.id,
                title: entryData.title,
                username: encUsername ? encUsername.cipherText : null,
                password: encPassword.cipherText,
                url: entryData.url,
                category: entryData.category,
                notes: encNotes ? encNotes.cipherText : null,
                iv: JSON.stringify(ivs)
            }])
            .select();

        if (error) throw error;
        return data[0];
    },

    /**
     * Aktualisiert einen Eintrag
     */
    updateEntry: async function(id, entryData) {
        const encPassword = await window.Crypto.encrypt(entryData.password);
        const encUsername = entryData.username ? await window.Crypto.encrypt(entryData.username) : null;
        const encNotes = entryData.notes ? await window.Crypto.encrypt(entryData.notes) : null;

        const ivs = {
            password: encPassword.iv,
            username: encUsername ? encUsername.iv : null,
            notes: encNotes ? encNotes.iv : null
        };

        const { data, error } = await window.supabaseClient
            .from('password_entries')
            .update({
                title: entryData.title,
                username: encUsername ? encUsername.cipherText : null,
                password: encPassword.cipherText,
                url: entryData.url,
                category: entryData.category,
                notes: encNotes ? encNotes.cipherText : null,
                iv: JSON.stringify(ivs),
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    /**
     * Löscht einen Eintrag
     */
    deleteEntry: async function(id) {
        const { error } = await window.supabaseClient
            .from('password_entries')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

window.Vault = Vault;
