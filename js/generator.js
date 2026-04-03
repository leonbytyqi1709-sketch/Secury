/**
 * Secury Password Generator
 */

const Generator = {
    generate: function(length, options) {
        const charset = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-='
        };

        let allowedChars = '';
        if (options.uppercase) allowedChars += charset.uppercase;
        if (options.lowercase) allowedChars += charset.lowercase;
        if (options.numbers) allowedChars += charset.numbers;
        if (options.symbols) allowedChars += charset.symbols;

        if (allowedChars === '') allowedChars = charset.lowercase; // Fallback

        let password = '';
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            password += allowedChars[randomValues[i] % allowedChars.length];
        }

        return password;
    },

    calculateStrength: function(password) {
        let score = 0;
        if (!password) return 'Weak';
        
        if (password.length > 8) score += 1;
        if (password.length > 12) score += 1;
        if (password.length >= 16) score += 1;

        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        if (score < 3) return 'Weak';
        if (score < 5) return 'Fair';
        if (score < 7) return 'Strong';
        return 'Very Strong';
    }
};

window.Generator = Generator;
