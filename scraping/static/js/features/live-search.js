import { domCache } from '../core/dom-cache.js';
import { CONFIG } from '../core/config.js';

// ===== BÚSQUEDA EN TIEMPO REAL MEJORADA =====
function setupLiveSearch() {
    const searchInput = domCache.get('input[name="q"]');
    if (!searchInput) return;
    
    let searchTimeout;
    const originalPlaceholder = searchInput.placeholder;
    const form = searchInput.closest('form');
    
    // Debounced search
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        const value = this.value.trim();
        
        if (value.length > 2) {
            searchTimeout = setTimeout(() => {
                this.placeholder = 'Buscando...';
                form.submit();
            }, CONFIG.SEARCH_DEBOUNCE);
        } else if (value.length === 0) {
            this.placeholder = originalPlaceholder;
        }
    });
    
    // Búsqueda al presionar Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            clearTimeout(searchTimeout);
            form.submit();
        }
    });
    
    // Limpiar búsqueda
    const clearBtn = domCache.get('.search-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchInput.focus();
            form.submit();
        });
    }
}

export { setupLiveSearch };