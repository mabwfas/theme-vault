// ThemeVault - API Module
const VaultAPI = {
    storage: {
        get(key, def = null) { try { return JSON.parse(localStorage.getItem(`vault_${key}`)) || def; } catch { return def; } },
        set(key, val) { localStorage.setItem(`vault_${key}`, JSON.stringify(val)); }
    },

    themes: {
        getAll() { return VaultAPI.storage.get('themes', []); },
        save(themes) { VaultAPI.storage.set('themes', themes); },
        add(theme) {
            const themes = this.getAll();
            theme.id = 'THEME-' + Date.now().toString(36).toUpperCase();
            theme.createdAt = new Date().toISOString();
            theme.version = 1;
            theme.backups = [];
            themes.unshift(theme);
            this.save(themes);
            return theme;
        },
        update(id, updates) {
            const themes = this.getAll();
            const idx = themes.findIndex(t => t.id === id);
            if (idx !== -1) {
                if (updates.css && updates.css !== themes[idx].css) {
                    themes[idx].version = (themes[idx].version || 1) + 1;
                    themes[idx].lastModified = new Date().toISOString();
                }
                Object.assign(themes[idx], updates);
                this.save(themes);
                return themes[idx];
            }
            return null;
        },
        delete(id) { let themes = this.getAll(); themes = themes.filter(t => t.id !== id); this.save(themes); },
        backup(id) {
            const themes = this.getAll();
            const theme = themes.find(t => t.id === id);
            if (theme) {
                theme.backups = theme.backups || [];
                theme.backups.unshift({
                    id: 'BKP-' + Date.now().toString(36).toUpperCase(),
                    version: theme.version,
                    css: theme.css,
                    createdAt: new Date().toISOString()
                });
                if (theme.backups.length > 10) theme.backups.pop();
                this.save(themes);
                return theme.backups[0];
            }
            return null;
        },
        restore(themeId, backupId) {
            const themes = this.getAll();
            const theme = themes.find(t => t.id === themeId);
            if (theme) {
                const backup = theme.backups.find(b => b.id === backupId);
                if (backup) {
                    theme.css = backup.css;
                    theme.version = (theme.version || 1) + 1;
                    theme.lastModified = new Date().toISOString();
                    this.save(themes);
                    return true;
                }
            }
            return false;
        }
    },

    diffs: {
        compare(oldCss, newCss) {
            const oldLines = oldCss.split('\n');
            const newLines = newCss.split('\n');
            const changes = [];

            const maxLines = Math.max(oldLines.length, newLines.length);
            for (let i = 0; i < maxLines; i++) {
                if (oldLines[i] !== newLines[i]) {
                    if (oldLines[i] && !newLines[i]) changes.push({ type: 'removed', line: i + 1, content: oldLines[i] });
                    else if (!oldLines[i] && newLines[i]) changes.push({ type: 'added', line: i + 1, content: newLines[i] });
                    else changes.push({ type: 'modified', line: i + 1, old: oldLines[i], new: newLines[i] });
                }
            }
            return changes;
        }
    },

    getAnalytics() {
        const themes = this.themes.getAll();
        const totalBackups = themes.reduce((sum, t) => sum + (t.backups?.length || 0), 0);
        const totalSize = themes.reduce((sum, t) => sum + (t.css?.length || 0), 0);
        return { total: themes.length, backups: totalBackups, sizeKB: (totalSize / 1024).toFixed(1) };
    },

    toast: { show(msg, type = 'success') { const c = document.getElementById('toast-container') || this.create(); const t = document.createElement('div'); t.className = `toast toast-${type}`; t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : 'info'}-circle"></i> ${msg}`; c.appendChild(t); setTimeout(() => t.classList.add('show'), 10); setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000); }, create() { const c = document.createElement('div'); c.id = 'toast-container'; c.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;'; document.body.appendChild(c); const s = document.createElement('style'); s.textContent = '.toast{display:flex;align-items:center;gap:10px;padding:12px 20px;background:#1e1e3f;border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:#fff;margin-bottom:10px;transform:translateX(120%);transition:0.3s;}.toast.show{transform:translateX(0);}.toast-success{border-left:3px solid #10b981;}'; document.head.appendChild(s); return c; } }
};
window.VaultAPI = VaultAPI;
