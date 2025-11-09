import { domCache } from '../core/dom-cache.js';
import { appState } from '../core/app-state.js';
import { showNotification } from '../components/notifications.js';

// ===== SELECTOR DE ELEMENTOS POR PÁGINA MEJORADO =====
function setupPerPageSelector() {
    const select = domCache.get('#per-page');
    if (!select) return;
    
    select.addEventListener('change', function() {
        const perPage = this.value;
        const url = new URL(window.location);
        url.searchParams.set('per_page', perPage);
        url.searchParams.set('page', '1');
        
        showNotification(`Mostrando ${perPage} noticias por página`, 'info');
        
        const requestId = `perpage-${Date.now()}`;
        appState.addPendingRequest(requestId);
        
        window.location.href = url.toString();
    });
}

export { setupPerPageSelector };