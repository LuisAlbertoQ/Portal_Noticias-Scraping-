import { domCache } from '../core/dom-cache.js';
import { appState } from '../core/app-state.js';
import { showNotification } from './notifications.js';
import { CONFIG } from '../core/config.js';

// ===== SISTEMA DE FILTROS AVANZADO MEJORADO =====
class FilterManager {
    constructor() {
        this.form = domCache.get('#filter-form');
        this.fechaSelect = domCache.get('#fecha-select');
        this.dateRangeGroup = domCache.get('#date-range-group');
        this.handlers = [];
        this.isInitialized = false;
        this.filterBarObserver = null;
    }
    
    init() {
        if (!this.form || this.isInitialized) return;
        
        try {
            // Inicializar detección de filter-bars
            this.initFilterBarDetection();
            
            // Manejar cambio en selector de fecha
            if (this.fechaSelect) {
                this.addHandler(this.fechaSelect, 'change', () => this.toggleDateRange());
                // Inicializar estado
                this.toggleDateRange();
            }
            
            // Prevenir submit si rango está incompleto
            this.addHandler(this.form, 'submit', (e) => this.validateForm(e));
            
            // Auto-submit mejorado
            this.setupAutoSubmit();
            
            // Sincronizar con estado global
            this.syncWithGlobalState();

            this.setupFilterButtons();
            
            this.isInitialized = true;
            console.log('✅ FilterManager inicializado');
        } catch (error) {
            console.error('❌ Error inicializando FilterManager:', error);
        }
    }
    setupFilterButtons() {
        // Botón de limpiar todos los filtros
        const clearBtn = domCache.get('#clear-filters-btn');
        if (clearBtn) {
            this.addHandler(clearBtn, 'click', (e) => {
                e.preventDefault();
                clearFilters();
            });
        }

        // Botones para quitar filtros individuales
        const removeButtons = domCache.getAll('.filter-tag-close');
        removeButtons.forEach(btn => {
            this.addHandler(btn, 'click', (e) => {
                e.preventDefault();
                const filterName = btn.dataset.filterName;
                if (filterName) {
                    removeFilter(filterName);
                }
            });
        });
    }
    
    // ===== DETECCIÓN DE FILTER-BARS =====
    initFilterBarDetection() {
        // Actualizar todas las filter-bars al inicio
        this.updateAllFilterBars();
        
        // Configurar MutationObserver para cambios dinámicos
        this.filterBarObserver = new MutationObserver((mutations) => {
            const touched = new Set();
            
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    // Procesar nodos añadidos
                    mutation.addedNodes && mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            const filterBar = node.closest ? node.closest('.filter-bar') : null;
                            if (filterBar) touched.add(filterBar);
                        }
                    });
                    
                    // Procesar nodos eliminados
                    mutation.removedNodes && mutation.removedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            const filterBar = node.closest ? node.closest('.filter-bar') : null;
                            if (filterBar) touched.add(filterBar);
                        }
                    });
                }
                
                // También verificar el objetivo de la mutación
                if (mutation.target && mutation.target.nodeType === 1) {
                    const filterBar = mutation.target.closest ? mutation.target.closest('.filter-bar') : null;
                    if (filterBar) touched.add(filterBar);
                }
            });
            
            // Actualizar solo las filter-bars afectadas
            touched.forEach((bar) => {
                if (bar) this.updateSingleFilterBar(bar);
            });
        });
        
        // Observar cambios en todo el documento
        this.filterBarObserver.observe(document.body, { 
            childList: true, 
            subtree: true 
        });
    }
    
    updateSingleFilterBar(bar) {
        if (!bar) return;
        
        if (bar.querySelector('.filter-container')) {
            bar.classList.add('filter-bar--has-container');
            bar.classList.remove('filter-bar--no-container');
        } else {
            bar.classList.add('filter-bar--no-container');
            bar.classList.remove('filter-bar--has-container');
        }
    }
    
    updateAllFilterBars() {
        document.querySelectorAll('.filter-bar').forEach(bar => {
            this.updateSingleFilterBar(bar);
        });
    }
    
    // Resto de los métodos de FilterManager...
    addHandler(element, event, handler) {
        if (!element) return;
        element.addEventListener(event, handler);
        this.handlers.push({ element, event, handler });
    }
    
    toggleDateRange() {
        if (!this.dateRangeGroup) return;
        
        const isRangoSelected = this.fechaSelect.value === 'rango';
        this.dateRangeGroup.style.display = isRangoSelected ? 'block' : 'none';
        
        // Animación suave
        if (isRangoSelected) {
            setTimeout(() => {
                this.dateRangeGroup.style.opacity = '1';
                this.dateRangeGroup.style.transform = 'translateY(0)';
            }, 50);
        } else {
            this.dateRangeGroup.style.opacity = '0';
            this.dateRangeGroup.style.transform = 'translateY(-10px)';
        }
        
        // Limpiar fechas si no es rango
        if (!isRangoSelected) {
            const inputs = this.dateRangeGroup.querySelectorAll('input[type="date"]');
            inputs.forEach(input => input.value = '');
        }
    }
    
    validateForm(e) {
        if (this.fechaSelect.value === 'rango') {
            const fechaDesde = domCache.get('input[name="fecha_desde"]');
            const fechaHasta = domCache.get('input[name="fecha_hasta"]');
            
            if (!fechaDesde?.value || !fechaHasta?.value) {
                e.preventDefault();
                showNotification('Por favor, selecciona ambas fechas para el rango', 'warning');
                return false;
            }
            
            if (new Date(fechaDesde.value) > new Date(fechaHasta.value)) {
                e.preventDefault();
                showNotification('La fecha inicial no puede ser mayor a la fecha final', 'error');
                return false;
            }
        }
        
        // Mostrar loading con estado global
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            const requestId = `form-submit-${Date.now()}`;
            appState.addPendingRequest(requestId);
            
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Filtrando...';
            
            // Limpiar después de 30s por si falla
            setTimeout(() => {
                if (appState.get('pendingRequests').has(requestId)) {
                    appState.removePendingRequest(requestId);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Filtrar';
                    showNotification('La solicitud tardó demasiado tiempo', 'error');
                }
            }, CONFIG.REQUEST_TIMEOUT);
        }
        
        return true;
    }
    
    setupAutoSubmit() {
        // Auto-submit para filtros rápidos
        const quickFilters = this.form.querySelectorAll('select.auto-submit, input.auto-submit');
        quickFilters.forEach(element => {
            this.addHandler(element, 'change', () => {
                if (this.validateForm({ preventDefault: () => {} })) {
                    this.form.submit();
                }
            });
        });
    }
    
    syncWithGlobalState() {
        // Sincronizar filtros activos con estado global
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.forEach((value, key) => {
            appState.set('filters', new Map([...appState.get('filters'), [key, value]]));
        });
    }
    
    clear() {
        clearFilters();
    }
    
    removeFilter(filterName) {
        removeFilter(filterName);
    }
    
    destroy() {
        // Limpiar observador de filter-bars
        if (this.filterBarObserver) {
            this.filterBarObserver.disconnect();
        }
        
        // Limpiar otros handlers
        this.handlers.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.handlers = [];
        this.isInitialized = false;
    }
}

// Funciones globales
function clearFilters() {
    const url = new URL(window.location);
    const perPage = url.searchParams.get('per_page');
    url.search = '';
    if (perPage) {
        url.searchParams.set('per_page', perPage);
    }
    window.location.href = url.toString();
}

function removeFilter(filterName) {
    const url = new URL(window.location);
    url.searchParams.delete(filterName);
    
    // Si se elimina fecha, también eliminar rango
    if (filterName === 'fecha') {
        url.searchParams.delete('fecha_desde');
        url.searchParams.delete('fecha_hasta');
    }
    
    window.location.href = url.toString();
}

export { FilterManager, clearFilters, removeFilter };