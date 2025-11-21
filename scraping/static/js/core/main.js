import { appState } from './app-state.js';
import { showNotification } from '../components/notifications.js';
import { FilterManager, clearFilters, removeFilter } from '../components/filters.js';
import { ImageManager } from '../components/image-manager.js';
import { CardLayoutManager } from '../components/card-layout.js';
import { ScrapingManager } from '../components/scraping.js';
import { setupPagination } from '../features/pagination.js';
import { setupPerPageSelector } from '../features/per-page-selector.js';
import { setupLiveSearch } from '../features/live-search.js';
import { setupMobileNavigation } from '../features/mobile-nav.js';
import { initScrollAnimations } from '../utils/animations.js';
import { setupErrorHandling } from '../utils/error-handling.js';
import { setupKeyboardNavigation } from '../utils/accessibility.js';
import { setupPerformanceMonitoring } from '../utils/performance.js';
import { injectStyles } from '../utils/styles.js';
import {
    compartirNoticia,
    fallbackShare,
    legacyCopy,
    registrarCompartirActividad,
    detectarPlataformaCompartir,
    isMobileDevice,
    truncateText,
    formatDate,
    smoothScrollTo,
    debounce
} from '../utils/helpers.js';
import { registrarVista, actualizarContadorVistas, initViewTracking } from '../components/view-tracking.js';

// Exponer funciones globales de filtros
window.clearFilters = clearFilters;
window.removeFilter = removeFilter;

// ===== INICIALIZACIÓN PRINCIPAL MEJORADA =====
class NewsPortalApp {
    constructor() {
        this.modules = new Map();
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        console.log('🚀 Inicializando portal de noticias mejorado...');
        
        try {
            // Inyectar estilos primero
            injectStyles();
            
            // Configurar manejo de errores
            setupErrorHandling();
            
            // Inicializar estado global
            this.setupGlobalState();
            
            // Inicializar módulos en orden de prioridad
            await this.initializeCriticalModules();
            
            // Inicializar módulos secundarios (lazy)
            requestIdleCallback(() => {
                this.initializeSecondaryModules();
            });
            
            // Configurar performance
            setupPerformanceMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Portal mejorado inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error durante la inicialización:', error);
            showNotification('Error al cargar algunas funciones de la página', 'error');
            this.showFallbackUI();
        }
    }
    
    setupGlobalState() {
        // Suscribirse a cambios de estado global
        appState.subscribe('isLoading', (isLoading) => {
            if (isLoading) {
                document.body.classList.add('loading');
            } else {
                document.body.classList.remove('loading');
            }
        });
    }
    
    initializeCriticalModules() {
        return new Promise((resolve) => {
            // Módulos críticos que deben cargarse inmediatamente
            window.filterManager = new FilterManager();
            window.filterManager.init();
            
            window.imageManager = new ImageManager();
            
            window.cardLayoutManager = new CardLayoutManager();
            
            // Módulos que necesitan DOM completo
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }
    
    initializeSecondaryModules() {
        // Módulos que pueden cargarse cuando el navegador esté libre
        window.scrapingManager = new ScrapingManager();
        window.scrapingManager.init();
        
        // Funcionalidades adicionales
        setupPagination();
        setupPerPageSelector();
        setupLiveSearch();
        setupMobileNavigation();
        setupKeyboardNavigation();
        initScrollAnimations();
        
        // Configurar utilidades globales
        this.setupGlobalUtilities();
    }
    
    setupGlobalUtilities() {
        // Exponer utilidades globalmente
        window.appState = appState;
        window.notificationSystem = window.notificationSystem || { show: showNotification };
        // Exponer funciones del modal de actualización
        window.showUpgradeModal = () => {
            const modal = document.getElementById('upgrade-modal');
            if (modal) {
                modal.style.display = 'block';
            } else {
                // Fallback si el modal no está disponible
                window.location.href = '/accounts/planes/';
            }
        };
        
        window.closeUpgradeModal = () => {
            const modal = document.getElementById('upgrade-modal');
            if (modal) {
                modal.style.display = 'none';
            }
        };
        
        // Exponer funciones globales
        window.compartirNoticia = compartirNoticia;
        window.fallbackShare = fallbackShare;
        window.legacyCopy = legacyCopy;
        window.registrarCompartirActividad = registrarCompartirActividad;
        window.detectarPlataformaCompartir = detectarPlataformaCompartir;
        window.isMobileDevice = isMobileDevice;
        window.truncateText = truncateText;
        window.formatDate = formatDate;
        window.smoothScrollTo = smoothScrollTo;
        window.debounce = debounce;

        // Exponer funciones usadas por templates (ya no necesarias si usas data-atributos)
        window.registrarVista = registrarVista;
        window.actualizarContadorVistas = actualizarContadorVistas;

        // Activar delegación para registrar vistas sin onclick inline
        initViewTracking();

        // Configurar event listeners para botones de compartir
        this.setupShareButtons();
        
        // Info de debug (solo desarrollo)
        if (window.location.hostname === 'localhost') {
            this.setupDebugInfo();
        }
    }
    
    setupDebugInfo() {
        const urlParams = new URLSearchParams(window.location.search);
        const hasFilters = urlParams.has('fecha') || urlParams.has('con_imagen') || urlParams.has('q');
        
        if (hasFilters) {
            console.log('🔍 Filtros activos:', Object.fromEntries(urlParams));
        }
        
        console.log('📊 Módulos cargados:', Array.from(this.modules.keys()));
    }
    
    showFallbackUI() {
        // UI de fallback para cuando hay errores críticos
        const fallbackStyle = `
            .news-card { opacity: 1 !important; }
            .loading { animation: none !important; }
        `;
        
        const style = document.createElement('style');
        style.textContent = fallbackStyle;
        document.head.appendChild(style);
    }
    
    destroy() {
        // Cleanup para SPA o recargas
        this.modules.forEach(module => {
            if (module.destroy) module.destroy();
        });
        this.modules.clear();
        this.isInitialized = false;
    }

    setupShareButtons() {
        document.addEventListener('click', (event) => {
            const shareBtn = event.target.closest('.share-btn');
            if (shareBtn) {
                const noticiaId = shareBtn.dataset.noticiaId;
                const titulo = shareBtn.dataset.noticiaTitulo;
                const enlace = shareBtn.dataset.noticiaEnlace;
                
                if (noticiaId && titulo) {
                    compartirNoticia(titulo, enlace, parseInt(noticiaId));
                }
            }
        });
    }
}

export { NewsPortalApp };