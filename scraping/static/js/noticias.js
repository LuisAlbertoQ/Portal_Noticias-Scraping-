// ===== CONFIGURACIÓN GLOBAL =====
const CONFIG = {
    ANIMATION_DELAY: 100,
    NOTIFICATION_DURATION: 3000,
    SEARCH_DEBOUNCE: 300,
    MAX_RETRIES: 3
};

// ===== SISTEMA DE FILTROS AVANZADO =====
class FilterManager {
    constructor() {
        this.form = document.getElementById('filter-form');
        this.fechaSelect = document.getElementById('fecha-select');
        this.dateRangeGroup = document.getElementById('date-range-group');
        this.init();
    }
    
    init() {
        if (!this.form) return;
        
        // Manejar cambio en selector de fecha
        if (this.fechaSelect) {
            this.fechaSelect.addEventListener('change', () => this.toggleDateRange());
            // Inicializar estado
            this.toggleDateRange();
        }
        
        // Prevenir submit si rango está incompleto
        this.form.addEventListener('submit', (e) => this.validateForm(e));
        
        // Auto-submit en cambios (opcional)
        this.setupAutoSubmit();
    }
    
    toggleDateRange() {
        if (!this.dateRangeGroup) return;
        
        const isRangoSelected = this.fechaSelect.value === 'rango';
        this.dateRangeGroup.style.display = isRangoSelected ? 'block' : 'none';
        
        // Limpiar fechas si no es rango
        if (!isRangoSelected) {
            const inputs = this.dateRangeGroup.querySelectorAll('input[type="date"]');
            inputs.forEach(input => input.value = '');
        }
    }
    
    validateForm(e) {
        if (this.fechaSelect.value === 'rango') {
            const fechaDesde = document.querySelector('input[name="fecha_desde"]');
            const fechaHasta = document.querySelector('input[name="fecha_hasta"]');
            
            if (!fechaDesde.value || !fechaHasta.value) {
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
        
        // Mostrar loading
        const submitBtn = this.form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Filtrando...';
        }
        
        return true;
    }
    
    setupAutoSubmit() {
        // Auto-submit al cambiar imagen (opcional, comentado por defecto)
        // const imagenSelect = this.form.querySelector('select[name="con_imagen"]');
        // if (imagenSelect) {
        //     imagenSelect.addEventListener('change', () => this.form.submit());
        // }
    }
    
    clear() {
        clearFilters();
    }
    
    removeFilter(filterName) {
        removeFilter(filterName);
    }
}

// ===== FUNCIONES GLOBALES DE FILTROS =====
window.clearFilters = function() {
    const url = new URL(window.location);
    const perPage = url.searchParams.get('per_page');
    url.search = '';
    if (perPage) {
        url.searchParams.set('per_page', perPage);
    }
    window.location.href = url.toString();
};

window.removeFilter = function(filterName) {
    const url = new URL(window.location);
    url.searchParams.delete(filterName);
    
    // Si se elimina fecha, también eliminar rango
    if (filterName === 'fecha') {
        url.searchParams.delete('fecha_desde');
        url.searchParams.delete('fecha_hasta');
    }
    
    window.location.href = url.toString();
};

// ===== SISTEMA DE TAMAÑOS DINÁMICOS PARA CARDS =====
function assignCardSizes() {
    const cards = document.querySelectorAll('.news-card');
    const totalCards = cards.length;

    cards.forEach((card, index) => {
        card.classList.remove('large', 'medium', 'small');
        
        if (totalCards > 6) {
            if (index === 0) {
                card.classList.add('large');
            } else if ((index + 1) % 7 === 0) {
                card.classList.add('large');
            } else if ((index + 1) % 4 === 0 || (index + 1) % 5 === 0) {
                card.classList.add('medium');
            } else {
                card.classList.add('small');
            }
        } else if (totalCards > 3) {
            if (index === 0) {
                card.classList.add('large');
            } else if (index === 1) {
                card.classList.add('medium');
            } else {
                card.classList.add('small');
            }
        } else {
            card.classList.add('medium');
        }

        card.style.animationDelay = `${(index * 0.1)}s`;
    });
}

// ===== MANEJO DE PAGINACIÓN MEJORADO =====
function setupPagination() {
    const paginacion = document.querySelector('.pagination');
    if (paginacion) {
        paginacion.addEventListener('click', function(e) {
            if (e.target.classList.contains('page-link')) {
                // Scroll suave al inicio
                setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
                
                // Mostrar indicador de carga
                showNotification('Cargando página...', 'info');
            }
        });
    }
}

// ===== SELECTOR DE ELEMENTOS POR PÁGINA =====
function setupPerPageSelector() {
    const select = document.getElementById('per-page');
    if (!select) return;
    
    select.addEventListener('change', function() {
        const perPage = this.value;
        const url = new URL(window.location);
        url.searchParams.set('per_page', perPage);
        url.searchParams.set('page', '1');
        
        showNotification(`Mostrando ${perPage} noticias por página`, 'info');
        window.location.href = url.toString();
    });
}

// ===== MANEJO DE IMÁGENES =====
function setupImageHandling() {
    const images = document.querySelectorAll('.news-image');
    
    images.forEach(img => {
        img.addEventListener('loadstart', function() {
            this.style.opacity = '0.5';
        });

        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.closest('.image-container')?.classList.add('loaded');
        });

        img.addEventListener('error', function() {
            const container = this.closest('.image-container');
            if (!container) return;
            
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.innerHTML = '<i class="fas fa-image"></i>';
            container.replaceChild(placeholder, this);
        });
    });
}

// ===== ANIMACIONES DE ENTRADA =====
function initScrollAnimations() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        document.querySelectorAll('.news-card').forEach(card => {
            observer.observe(card);
        });
    } else {
        document.querySelectorAll('.news-card').forEach(card => {
            card.classList.add('fade-in');
        });
    }
}

// ===== COMPARTIR NOTICIA =====
window.compartirNoticia = function(titulo, enlace) {
    const url = enlace || window.location.href;
    const texto = `📰 ${titulo}`;
    
    if (navigator.share) {
        navigator.share({
            title: titulo,
            text: texto,
            url: url
        }).catch(err => {
            if (err.name !== 'AbortError') {
                fallbackShare(texto, url);
            }
        });
    } else {
        fallbackShare(texto, url);
    }
};

function fallbackShare(texto, url) {
    const shareText = `${texto}\n${url}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(shareText)
            .then(() => {
                showNotification('¡Enlace copiado al portapapeles!', 'success');
            })
            .catch(() => {
                showNotification('No se pudo copiar el enlace', 'error');
            });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            document.execCommand('copy');
            showNotification('¡Enlace copiado al portapapeles!', 'success');
        } catch (err) {
            showNotification('No se pudo copiar el enlace', 'error');
        }
        
        document.body.removeChild(textArea);
    }
}

// ===== SISTEMA DE NOTIFICACIONES =====
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${getIconForType(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;

    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 10000;
        animation: slideInFromRight 0.3s ease;
        max-width: 350px;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    const autoRemove = setTimeout(() => {
        notification.style.animation = 'slideOutToRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, CONFIG.NOTIFICATION_DURATION);

    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        notification.style.animation = 'slideOutToRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
}

function getIconForType(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

// ===== MANEJO DE SCRAPING =====
function setupScrapingButtons() {
    const buttons = [
        { id: 'scraping-btn', endpoint: '/scraping/lista' },
        { id: 'scraping-tecnologia-btn', endpoint: '/scraping/tecnologia' },
        { id: 'scraping-mundo-btn', endpoint: '/scraping/mundo' },
        { id: 'scraping-economia-btn', endpoint: '/scraping/economia' },
        { id: 'scraping-politica-btn', endpoint: '/scraping/politica' },
        { id: 'scraping-lista-btn', endpoint: '/scraping/lista' }
    ];

    buttons.forEach(({ id, endpoint }) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => handleScraping(btn, endpoint));
        }
    });
}

async function handleScraping(button, endpoint) {
    const originalHTML = button.innerHTML;
    const originalDisabled = button.disabled;

    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scrapeando...';
        button.classList.add('loading');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.status === 'ok') {
            showNotification(data.message || '¡Scraping completado exitosamente!', 'success');
            
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification(data.message || `Error: ${data.error}`, 'error');
            button.disabled = originalDisabled;
            button.innerHTML = originalHTML;
            button.classList.remove('loading');
        }

    } catch (error) {
        console.error('Error en scraping:', error);
        showNotification(`Error inesperado: ${error.message}`, 'error');
        button.disabled = originalDisabled;
        button.innerHTML = originalHTML;
        button.classList.remove('loading');
    }
}

// ===== BÚSQUEDA EN TIEMPO REAL (OPCIONAL) =====
function setupLiveSearch() {
    const searchInput = document.querySelector('input[name="q"]');
    if (!searchInput) return;
    
    let searchTimeout;
    const originalPlaceholder = searchInput.placeholder;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        
        const value = this.value.trim();
        
        if (value.length > 0) {
            this.placeholder = 'Presiona Enter para buscar...';
        } else {
            this.placeholder = originalPlaceholder;
        }
    });
    
    // Búsqueda al presionar Enter
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.closest('form').submit();
        }
    });
}

// ===== FUNCIÓN PARA CSRF TOKEN =====
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// ===== LAZY LOADING =====
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    if (img.dataset.src) {
                        img.style.opacity = '0.5';
                        
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            img.src = tempImg.src;
                            img.style.opacity = '1';
                            img.removeAttribute('data-src');
                        };
                        tempImg.onerror = () => {
                            const parent = img.parentElement;
                            if (!parent) return;

                            const placeholder = document.createElement('div');
                            placeholder.className = 'image-placeholder';
                            placeholder.innerHTML = '<i class="fas fa-image"></i>';
                            parent.replaceChild(placeholder, img);
                        };
                        tempImg.src = img.dataset.src;
                        
                        observer.unobserve(img);
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

// ===== MANEJO DE ERRORES =====
function setupErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Error global:', e.error);
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Promise rechazada:', e.reason);
    });
}

// ===== NAVEGACIÓN MÓVIL =====
function setupMobileNavigation() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navWrapper = document.querySelector('.nav-wrapper');
    
    if (mobileToggle && navWrapper) {
        mobileToggle.addEventListener('click', () => {
            navWrapper.classList.toggle('active');
            
            const icon = mobileToggle.querySelector('i');
            if (navWrapper.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navWrapper.classList.remove('active');
                    mobileToggle.querySelector('i').className = 'fas fa-bars';
                }
            });
        });

        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !navWrapper.contains(e.target)) {
                navWrapper.classList.remove('active');
                mobileToggle.querySelector('i').className = 'fas fa-bars';
            }
        });
    }
}

// ===== ACCESIBILIDAD =====
function setupKeyboardNavigation() {
    document.querySelectorAll('.news-card').forEach((card, index) => {
        card.setAttribute('tabindex', '0');
        
        card.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const link = card.querySelector('.read-more');
                if (link) {
                    e.preventDefault();
                    link.click();
                }
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            // Ctrl+R ya hace reload por defecto
        }
        
        if (e.key === 'Escape') {
            const notification = document.querySelector('.notification');
            if (notification) {
                notification.remove();
            }
        }
    });
}

// ===== ANIMACIONES CSS INYECTADAS =====
function injectStyles() {
    const styles = `
        @keyframes slideInFromRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        @keyframes slideOutToRight {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }

        .loading {
            position: relative;
            overflow: hidden;
        }

        .loading::after {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
            to { left: 100%; }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando portal de noticias con filtros...');
    
    try {
        // Inyectar estilos
        injectStyles();
        
        // Inicializar manager de filtros
        const filterManager = new FilterManager();
        
        // Inicializar todos los módulos
        assignCardSizes();
        setupImageHandling();
        initScrollAnimations();
        setupPagination();
        setupPerPageSelector();
        setupScrapingButtons();
        setupLiveSearch();
        setupLazyLoading();
        setupErrorHandling();
        setupMobileNavigation();
        setupKeyboardNavigation();
        
        console.log('✅ Portal inicializado correctamente');
        
        // Mostrar info de filtros activos
        const urlParams = new URLSearchParams(window.location.search);
        const hasFilters = urlParams.has('fecha') || urlParams.has('con_imagen') || urlParams.has('q');
        
        if (hasFilters && window.location.hostname === 'localhost') {
            console.log('🔍 Filtros activos:', Object.fromEntries(urlParams));
        }
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        showNotification('Error al cargar la página', 'error');
    }
});

// ===== UTILIDADES GLOBALES =====
window.truncateText = function(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
};

window.formatDate = function(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hace 1 día';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

window.smoothScrollTo = function(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
};

console.log('📰 Sistema de noticias con filtros cargado completamente');