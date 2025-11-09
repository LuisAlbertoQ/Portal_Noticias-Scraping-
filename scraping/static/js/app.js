import { NewsPortalApp } from './core/main.js';

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
    window.newsPortalApp = new NewsPortalApp();
    window.newsPortalApp.initialize();
});