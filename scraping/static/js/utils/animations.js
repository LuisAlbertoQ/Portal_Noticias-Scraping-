import { domCache } from '../core/dom-cache.js';
import { CONFIG } from '../core/config.js';

// ===== ANIMACIONES DE SCROLL MEJORADAS =====
function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) {
        document.querySelectorAll('.news-card').forEach(card => {
            card.classList.add('fade-in');
        });
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: CONFIG.LAZY_LOAD_THRESHOLD,
        rootMargin: CONFIG.LAZY_LOAD_ROOT_MARGIN
    });

    document.querySelectorAll('.news-card, .fade-on-scroll').forEach(element => {
        observer.observe(element);
    });
}

export { initScrollAnimations };