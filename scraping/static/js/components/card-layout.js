import { domCache } from '../core/dom-cache.js';

// ===== SISTEMA DE CARD LAYOUT MEJORADO =====
class CardLayoutManager {
    constructor() {
        this.resizeObserver = null;
        this.currentLayout = 'auto';
        this.init();
    }
    
    init() {
        this.setupResizeObserver();
        this.assignInitialSizes();
    }
    
    setupResizeObserver() {
        if (!('ResizeObserver' in window)) return;
        
        this.resizeObserver = new ResizeObserver((entries) => {
            // Debounce para evitar múltiples ejecuciones
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        });
        
        const container = domCache.get('.news-grid, .cards-container');
        if (container) {
            this.resizeObserver.observe(container);
        }
    }
    
    handleResize() {
        const width = window.innerWidth;
        
        if (width < 768 && this.currentLayout !== 'mobile') {
            this.applyMobileLayout();
        } else if (width >= 768 && this.currentLayout !== 'desktop') {
            this.applyDesktopLayout();
        }
    }
    
    applyMobileLayout() {
        this.currentLayout = 'mobile';
        const cards = domCache.getAll('.news-card');
        
        cards.forEach(card => {
            card.classList.remove('large', 'medium', 'small');
            card.classList.add('mobile');
        });
    }
    
    applyDesktopLayout() {
        this.currentLayout = 'desktop';
        this.assignCardSizes();
    }
    
    assignInitialSizes() {
        if (window.innerWidth < 768) {
            this.applyMobileLayout();
        } else {
            this.assignCardSizes();
        }
    }
    
    assignCardSizes() {
        const cards = domCache.getAll('.news-card');
        const totalCards = cards.length;
        
        if (totalCards === 0) return;
        
        cards.forEach((card, index) => {
            card.classList.remove('large', 'medium', 'small', 'mobile');
            
            // Lógica mejorada de tamaños
            if (totalCards >= 8) {
                // Patrón para muchas cards
                if (index === 0 || (index + 1) % 8 === 0) {
                    card.classList.add('large');
                } else if ((index + 1) % 4 === 0 || (index + 1) % 5 === 0) {
                    card.classList.add('medium');
                } else {
                    card.classList.add('small');
                }
            } else if (totalCards >= 4) {
                // Patrón para cantidad media
                if (index === 0) {
                    card.classList.add('large');
                } else if (index === 1 || index === 2) {
                    card.classList.add('medium');
                } else {
                    card.classList.add('small');
                }
            } else {
                // Todas medianas para pocas cards
                card.classList.add('medium');
            }
            
            // Animación escalonada
            card.style.animationDelay = `${(index * 0.08)}s`;
        });
    }
    
    refresh() {
        domCache.clear('.news-card');
        this.assignInitialSizes();
    }
    
    destroy() {
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        clearTimeout(this.resizeTimeout);
    }
}

export { CardLayoutManager };