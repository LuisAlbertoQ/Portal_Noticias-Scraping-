import { domCache } from '../core/dom-cache.js';
import { appState } from '../core/app-state.js';

// ===== MANEJO DE PAGINACIÓN MEJORADO =====
function setupPagination() {
    const paginacion = domCache.get('.pagination');
    if (!paginacion) return;
    
    paginacion.addEventListener('click', function(e) {
        const target = e.target.closest('.page-link');
        if (!target) return;
        
        e.preventDefault();
        
        // Scroll suave al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Mostrar indicador de carga
        const requestId = `pagination-${Date.now()}`;
        appState.addPendingRequest(requestId);
        
        // Navegar después de un pequeño delay para que se vea la animación
        setTimeout(() => {
            window.location.href = target.href;
        }, 150);
    });
}

export { setupPagination };