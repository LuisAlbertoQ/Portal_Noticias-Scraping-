import { domCache } from '../core/dom-cache.js';
import { notificationSystem } from '../components/notifications.js';

// ===== ACCESIBILIDAD MEJORADA =====
function setupKeyboardNavigation() {
    // Cards navegables
    document.querySelectorAll('.news-card').forEach((card, index) => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'article');
        card.setAttribute('aria-label', `Noticia ${index + 1}`);
        
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const link = card.querySelector('.read-more, .card-link');
                if (link) {
                    link.click();
                }
            }
        });
    });

    // Navegación con teclado
    document.addEventListener('keydown', (e) => {
        // Skip to main content
        if (e.key === 'Tab' && e.shiftKey && e.altKey) {
            const main = domCache.get('main, .main-content');
            if (main) {
                e.preventDefault();
                main.focus();
            }
        }
        
        // Cerrar notificaciones con Escape
        if (e.key === 'Escape') {
            notificationSystem.clearAll();
        }
    });

    // Mejorar focus visible
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });

    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
}

export { setupKeyboardNavigation };