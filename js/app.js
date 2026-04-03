/**
 * Secury SPA Logic - Premium Level 1000 Edition
 */

document.addEventListener("DOMContentLoaded", async () => {
    // 1. Session prüfen
    const session = await window.Auth.checkSession();
    if (!session) return; 

    document.getElementById('app-root').style.display = 'flex';
    
    // User Info
    const user = await window.Auth.getUser();
    document.getElementById('user-name').textContent = user.email.split('@')[0];
    document.getElementById('user-avatar').textContent = user.email.charAt(0).toUpperCase();

    let allEntries = [];
    let currentFilter = '';
    
    // ==========================================
    // TOAST NOTIFICATIONS
    // ==========================================
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = type === 'success' ? '✓' : '⚠';
        toast.innerHTML = `<span style="font-size:1.2rem;">${icon}</span> <span>${escapeHtml(message)}</span>`;
        
        container.appendChild(toast);
        
        // Trigger reflow for animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for transition
        }, 3000);
    }

    // ==========================================
    // ROUTING & VIEW MANAGEMENT
    // ==========================================
    function switchView(viewId) {
        document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
        document.getElementById('view-' + viewId).classList.add('active');
        
        if (['vault', 'generator', 'settings'].includes(viewId)) {
            document.querySelectorAll('.nav-section:first-of-type .nav-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.nav-item[data-view="${viewId}"]`).classList.add('active');
            
            // Deaktivieren von Kategorien wenn nicht auf Vault
            if(viewId !== 'vault') {
                document.querySelectorAll('.category-filter').forEach(el => el.classList.remove('active'));
                currentFilter = '';
            } else {
                document.querySelector('.category-filter[data-cat=""]').classList.add('active');
            }
        }
    }

    document.querySelectorAll('[data-view]').forEach(btn => {
        btn.addEventListener('click', (e) => switchView(e.target.dataset.view));
    });

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await window.Auth.logout();
    });

    // ==========================================
    // TREASURE / VAULT LOGIK
    // ==========================================
    async function loadVault() {
        try {
            allEntries = await window.Vault.getEntries();
            renderVault();
        } catch (e) {
            document.getElementById('vault-list').innerHTML = `<div style="padding:2rem;color:var(--danger); text-align:center;">Fehlerhafte Entschlüsselung: ${e.message}</div>`;
        }
    }

    function renderVault() {
        const list = document.getElementById('vault-list');
        list.innerHTML = '';
        
        const q = document.getElementById('global-search').value.toLowerCase();
        
        const filtered = allEntries.filter(e => {
            if (currentFilter && e.category !== currentFilter) return false;
            if (q && !String(e.title).toLowerCase().includes(q) && !String(e.url).toLowerCase().includes(q) && !String(e.username).toLowerCase().includes(q)) return false;
            return true;
        });

        if(filtered.length === 0) {
            list.innerHTML = `
                <div style="padding:4rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center;">
                    <div style="font-size:3rem; margin-bottom:1rem; opacity:0.5;">📭</div>
                    <h3 style="color:var(--text-main); font-weight:600;">Tresor ist leer</h3>
                    <p style="color:var(--text-muted); max-width:300px; margin-top:0.5rem;">Wir konnten keine Passwörter finden, die den Kriterien entsprechen.</p>
                </div>`;
            return;
        }

        filtered.forEach(entry => {
            const row = document.createElement('div');
            row.className = 'data-row';
            
            // Emoji by Category (Nice UI touch)
            let catEmoji = '📁';
            if(entry.category === 'Arbeit') catEmoji = '💼';
            if(entry.category === 'Banking') catEmoji = '🏦';
            if(entry.category === 'Social Media') catEmoji = '📱';
            if(entry.category === 'Gaming') catEmoji = '🎮';
            
            row.innerHTML = `
                <div class="cell-title">
                    <div class="cell-icon">${catEmoji}</div>
                    <div>
                        ${escapeHtml(entry.title)}
                        ${entry.url ? `<a href="${escapeHtml(entry.url)}" target="_blank" style="display:block; font-size:0.75rem; color:var(--primary); font-weight:400; text-decoration:none;" onclick="event.stopPropagation()">🔗 URL besuchen</a>` : ''}
                    </div>
                </div>
                <div style="color:var(--text-muted); font-size:0.95rem;">${escapeHtml(entry.username || '-')}</div>
                <div>
                    <div class="pw-mask">••••••••</div>
                </div>
                <div style="text-align:right; display:flex; gap:0.5rem; justify-content:flex-end;">
                    <button class="btn btn-outline copy-pw" style="padding:6px; border-radius:6px;" data-pw="${escapeHtml(entry.password)}" title="Passwort kopieren">📋</button>
                    <button class="btn btn-outline copy-usr" style="padding:6px; border-radius:6px;" data-usr="${escapeHtml(entry.username)}" title="Username kopieren">👤</button>
                </div>
            `;
            // Row Click Event (Opens Drawer)
            row.addEventListener('click', (e) => {
                if(e.target.tagName !== 'BUTTON') openDrawer(entry);
            });
            list.appendChild(row);
        });

        // Copy Buttons Actions
        document.querySelectorAll('.copy-pw').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent row click
                navigator.clipboard.writeText(e.target.dataset.pw);
                showToast("Passwort in die Zwischenablage kopiert!");
            });
        });
        document.querySelectorAll('.copy-usr').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                if(!e.target.dataset.usr || e.target.dataset.usr==="-") {
                     showToast("Kein Benutzername vorhanden", "error");
                     return;
                }
                navigator.clipboard.writeText(e.target.dataset.usr);
                showToast("Benutzername kopiert!");
            });
        });
    }

    document.getElementById('global-search').addEventListener('input', renderVault);
    document.querySelectorAll('.category-filter').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentFilter = e.target.dataset.cat;
            document.querySelectorAll('.category-filter').forEach(el => el.classList.remove('active'));
            e.target.classList.add('active');
            switchView('vault');
            renderVault();
        });
    });

    // ==========================================
    // DRAWER / ENTRY FORM (Premium Overlay)
    // ==========================================
    const overlay = document.getElementById('drawer-overlay');
    const drawer = document.getElementById('entry-drawer');

    function closeDrawer() {
        drawer.classList.remove('open');
        overlay.classList.remove('open');
    }

    function openDrawer(entry = null) {
        document.getElementById('entry-form-title').textContent = entry ? 'Details bearbeiten' : 'Safe-Eintrag anlegen';
        document.getElementById('entry-id').value = entry ? entry.id : '';
        document.getElementById('entry-title').value = entry ? entry.title : '';
        document.getElementById('entry-username').value = entry ? entry.username : '';
        document.getElementById('entry-password').value = entry ? entry.password : '';
        document.getElementById('entry-password').type = 'password';
        document.getElementById('entry-url').value = entry ? entry.url : '';
        document.getElementById('entry-category').value = entry ? (entry.category || 'Sonstiges') : 'Sonstiges';
        
        document.getElementById('btn-delete').style.display = entry ? 'block' : 'none';
        
        overlay.classList.add('open');
        drawer.classList.add('open');
    }

    document.getElementById('btn-new-entry').addEventListener('click', () => openDrawer(null));
    document.getElementById('btn-drawer-close').addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);

    // Formular interaktionen im Drawer
    document.getElementById('entry-btn-gen').addEventListener('click', () => {
        const pw = window.Generator.generate(18, {uppercase:true, lowercase:true, numbers:true, symbols:true});
        document.getElementById('entry-password').value = pw;
        document.getElementById('entry-password').type = 'text';
        showToast("Starkes Passwort generiert");
    });
    document.getElementById('entry-btn-reveal').addEventListener('click', () => {
        const inp = document.getElementById('entry-password');
        inp.type = inp.type === 'password' ? 'text' : 'password';
    });

    document.getElementById('form-entry').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('entry-id').value;
        const data = {
            title: document.getElementById('entry-title').value,
            username: document.getElementById('entry-username').value,
            password: document.getElementById('entry-password').value,
            url: document.getElementById('entry-url').value,
            category: document.getElementById('entry-category').value
        };

        const btn = document.getElementById('btn-save');
        btn.disabled = true;
        btn.textContent = "Verschlüsselt...";
        
        try {
            if (id) {
                await window.Vault.updateEntry(id, data);
                showToast("Eintrag aktualisiert");
            } else {
                await window.Vault.createEntry(data);
                showToast("Sicher im Tresor abgelegt");
            }
            await loadVault();
            closeDrawer();
        } catch(err) {
            showToast("Fehlerhafte Operation: " + err.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "Eintrag sichern";
        }
    });

    document.getElementById('btn-delete').addEventListener('click', async () => {
        if(confirm("Möchtest du diesen Eintrag unwiderruflich zerstören?")) {
            try {
                await window.Vault.deleteEntry(document.getElementById('entry-id').value);
                showToast("Vollständig vernichtet");
                await loadVault();
                closeDrawer();
            } catch(e) {
                showToast("Fehler beim Löschen", "error");
            }
        }
    });

    // ==========================================
    // GENERATOR & SETTINGS
    // ==========================================
    const genLen = document.getElementById('gen-length');
    function updateGen() {
        const pw = window.Generator.generate(parseInt(genLen.value), {uppercase:true, lowercase:true, numbers:true, symbols:true});
        document.getElementById('gen-output').textContent = pw;
        document.getElementById('gen-len-display').textContent = genLen.value + ' Chars';
    }
    genLen.addEventListener('input', updateGen);
    document.getElementById('btn-gen-refresh').addEventListener('click', updateGen);
    document.getElementById('btn-gen-copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('gen-output').textContent);
        showToast("Generierte Phrase kopiert!");
    });
    
    document.getElementById('form-settings').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-settings');
        const newMp = document.getElementById('settings-new-pw').value;
        btn.disabled = true;
        btn.textContent = "Rekonstruiere Kryptomatrix...";
        try {
            const { error } = await window.supabaseClient.auth.updateUser({ password: newMp });
            if (error) throw error;
            
            await window.Crypto.deriveKey(newMp, user.email);
            for (const entry of allEntries) {
                if (entry._decryptionError) continue;
                await window.Vault.updateEntry(entry.id, entry);
            }
            showToast("Deine Tresor-Vektoren wurden mit neuem Key gesichert.");
            e.target.reset();
        } catch (err) {
            showToast("Operation abgelehnt: " + err.message, "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "🗝 Master-Key überschreiben";
        }
    });

    // Initial Load Boost
    updateGen();
    loadVault();

    // Utils
    function escapeHtml(unsafe) {
        if(!unsafe) return '';
        return String(unsafe).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
    }
});
