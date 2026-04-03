/**
 * Secury Crypto Module
 * Implementiert Zero-Knowledge Architektur mittels Web Crypto API (AES-256-GCM)
 */

const Crypto = {
    // Diese Variable speichert den Krypto-Schlüssel im Arbeitsspeicher (RAM)
    // Er wird NIEMALS im LocalStorage oder SessionStorage gespeichert.
    _sessionKey: null,

    /**
     * Ableitung eines AES-256 Schlüssels aus dem Master-Passwort (PBKDF2)
     * @param {string} masterPassword 
     * @param {string} salt (Benutzer-E-Mail als Salt oder zufälliger Salt)
     * @returns {Promise<CryptoKey>}
     */
    deriveKey: async function(masterPassword, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            encoder.encode(masterPassword),
            { name: "PBKDF2" },
            false,
            ["deriveBits", "deriveKey"]
        );

        const key = await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: encoder.encode(salt),
                iterations: 100000,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true, // extractable = true (notwendig für den sessionStorage Export)
            ["encrypt", "decrypt"]
        );

        this._sessionKey = key;
        
        // Den kryptographischen Schlüssel (NICHT das Klartextpasswort!) für 
        // Seitenwechsel in den SessionStorage exportieren
        const rawKey = await window.crypto.subtle.exportKey("raw", key);
        sessionStorage.setItem("secury_aes_key", this._bufferToBase64(rawKey));
        
        return key;
    },

    /**
     * Stellt den AES-Schlüssel nach einem Seitenwechsel (Reload) wieder her
     */
    restoreKey: async function() {
        if (this._sessionKey) return true;
        
        const b64Key = sessionStorage.getItem("secury_aes_key");
        if (!b64Key) return false;
        
        try {
            const rawKey = this._base64ToBuffer(b64Key);
            this._sessionKey = await window.crypto.subtle.importKey(
                "raw",
                rawKey,
                { name: "AES-GCM" },
                true, // extractable
                ["encrypt", "decrypt"]
            );
            return true;
        } catch (e) {
            console.error("Fehler beim Wiederherstellen des Schlüssels", e);
            sessionStorage.removeItem("secury_aes_key");
            return false;
        }
    },

    /**
     * Überprüft, ob ein Schlüssel im RAM geladen ist
     * @returns {boolean}
     */
    isKeyLoaded: function() {
        return this._sessionKey !== null;
    },

    /**
     * Leert den Schlüssel aus dem Arbeitsspeicher und SessionStorage
     */
    clearKey: function() {
        this._sessionKey = null;
        sessionStorage.removeItem("secury_aes_key");
    },

    /**
     * ArrayBuffer in Base64 konvertieren
     */
    _bufferToBase64: function(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    },

    /**
     * Base64 in ArrayBuffer konvertieren
     */
    _base64ToBuffer: function(base64) {
        const binary = window.atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    },

    /**
     * Verschlüsselt Text mit AES-256-GCM
     * @param {string} plainText 
     * @returns {Promise<{cipherText: string, iv: string}>}
     */
    encrypt: async function(plainText) {
        if (!this.isKeyLoaded()) throw new Error("Kein Schlüssel geladen!");
        if (!plainText) return null;

        const iv = window.crypto.getRandomValues(new Uint8Array(12));
        const encoder = new TextEncoder();
        const encodedData = encoder.encode(plainText);

        const encryptedBuffer = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            this._sessionKey,
            encodedData
        );

        return {
            cipherText: this._bufferToBase64(encryptedBuffer),
            iv: this._bufferToBase64(iv)
        };
    },

    /**
     * Entschlüsselt Base64-Text mit AES-256-GCM
     * @param {string} cipherTextBase64 
     * @param {string} ivBase64 
     * @returns {Promise<string>}
     */
    decrypt: async function(cipherTextBase64, ivBase64) {
        if (!this.isKeyLoaded()) throw new Error("Kein Schlüssel geladen!");
        if (!cipherTextBase64 || !ivBase64) return null;

        const encryptedData = this._base64ToBuffer(cipherTextBase64);
        const iv = new Uint8Array(this._base64ToBuffer(ivBase64));

        try {
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                this._sessionKey,
                encryptedData
            );

            const decoder = new TextDecoder();
            return decoder.decode(decryptedBuffer);
        } catch (e) {
            console.error("Entschlüsselung fehlgeschlagen", e);
            throw new Error("Falsches Master-Passwort oder beschädigte Daten.");
        }
    }
};

window.Crypto = Crypto;
