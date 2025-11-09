// ===== CACHE DE DOM MEJORADO =====
class DOMCache {
    constructor() {
        this.cache = new Map();
        this.observers = new Map();
    }
    
    get(selector) {
        if (!this.cache.has(selector)) {
            this.cache.set(selector, document.querySelector(selector));
        }
        return this.cache.get(selector);
    }
    
    getAll(selector) {
        const key = `all:${selector}`;
        if (!this.cache.has(key)) {
            this.cache.set(key, document.querySelectorAll(selector));
        }
        return this.cache.get(key);
    }
    
    clear(selector = null) {
        if (selector) {
            this.cache.delete(selector);
            this.cache.delete(`all:${selector}`);
        } else {
            this.cache.clear();
        }
    }
}

// Inicializar cache global
const domCache = new DOMCache();

export { domCache, DOMCache };