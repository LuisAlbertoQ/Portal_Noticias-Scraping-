// ===== SISTEMA DE TAMAÑOS DINÁMICOS PARA CARDS =====
function assignCardSizes() {
    const cards = document.querySelectorAll('.news-card');
    const totalCards = cards.length;

    cards.forEach((card, index) => {
        // Remover clases anteriores
        card.classList.remove('large', 'medium', 'small');
        
        // Patrón de tamaños dinámico basado en posición
        if (totalCards > 6) {
            // Para muchas noticias, crear un patrón más variado
            if (index === 0) {
                card.classList.add('large'); // Primera noticia siempre grande
            } else if ((index + 1) % 7 === 0) {
                card.classList.add('large'); // Cada 7 noticias, una grande
            } else if ((index + 1) % 4 === 0 || (index + 1) % 5 === 0) {
                card.classList.add('medium'); // Algunas medianas
            } else {
                card.classList.add('small'); // El resto pequeñas
            }
        } else if (totalCards > 3) {
            // Para pocas noticias, un patrón más simple
            if (index === 0) {
                card.classList.add('large');
            } else if (index === 1) {
                card.classList.add('medium');
            } else {
                card.classList.add('small');
            }
        } else {
            // Para muy pocas noticias, todas medianas
            card.classList.add('medium');
        }

        // Agregar animación escalonada
        card.style.animationDelay = `${(index * 0.1)}s`;
    });
}

// ===== MANEJO DE IMÁGENES MEJORADO =====
function setupImageHandling() {
    const images = document.querySelectorAll('.news-image');
    
    images.forEach(img => {
        // Placeholder mientras carga
        img.addEventListener('loadstart', function() {
            this.style.opacity = '0.5';
        });

        // Imagen cargada correctamente
        img.addEventListener('load', function() {
            this.style.opacity = '1';
            this.closest('.image-container').classList.add('loaded');
        });

        // Error al cargar imagen
        img.addEventListener('error', function() {
            const placeholder = document.createElement('div');
            placeholder.className = 'image-placeholder';
            placeholder.innerHTML = '<i class="fas fa-image"></i>';
            this.parentElement.replaceChild(placeholder, this);
        });
    });
}

// ===== ANIMACIONES DE ENTRADA MEJORADAS =====
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
        // Fallback para navegadores sin IntersectionObserver
        document.querySelectorAll('.news-card').forEach(card => {
            card.classList.add('fade-in');
        });
    }
}

// ===== COMPARTIR NOTICIA MEJORADO =====
window.compartirNoticia = function(titulo, enlace) {
    const url = enlace || window.location.href;
    const texto = `📰 ${titulo}`;
    
    if (navigator.share) {
        navigator.share({
            title: titulo,
            text: texto,
            url: url
        }).catch(err => {
            console.log('Error sharing:', err);
            fallbackShare(texto, url);
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
        // Fallback más antiguo
        const textArea = document.createElement('textarea');
        textArea.value = shareText;
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
    // Remover notificación existente si hay una
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

    // Estilos inline para la notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 1000;
        animation: slideInFromRight 0.3s ease;
        max-width: 300px;
        font-weight: 500;
    `;

    document.body.appendChild(notification);

    // Auto-remove después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutToRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);

    // Click para cerrar
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOutToRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
}

function getIconForType(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// ===== MANEJO DE SCRAPING MEJORADO =====
function setupScrapingButtons() {
    const buttons = [
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
        // Estado de carga
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scrapeando...';
        
        // Agregar clase de loading
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
            showNotification('¡Scraping completado exitosamente!', 'success');
            
            // Esperar un poco antes de recargar para mostrar la notificación
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } else {
            showNotification(`Error en scraping: ${data.error}`, 'error');
        }

    } catch (error) {
        console.error('Error en scraping:', error);
        showNotification(`Error inesperado: ${error.message}`, 'error');
    } finally {
        // Restaurar estado original del botón
        button.disabled = originalDisabled;
        button.innerHTML = originalHTML;
        button.classList.remove('loading');
    }
}

// ===== BÚSQUEDA EN TIEMPO REAL (OPCIONAL) =====
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterCards(this.value.toLowerCase());
            }, 300);
        });
    }
}

function filterCards(searchTerm) {
    const cards = document.querySelectorAll('.news-card');
    
    cards.forEach(card => {
        const title = card.querySelector('.news-title').textContent.toLowerCase();
        const shouldShow = title.includes(searchTerm);
        
        card.style.display = shouldShow ? 'flex' : 'none';
        
        // Animación suave
        if (shouldShow) {
            card.style.animation = 'fadeInUp 0.3s ease';
        }
    });
    
    // Mostrar mensaje si no hay resultados
    const visibleCards = document.querySelectorAll('.news-card[style*="flex"]').length;
    const noResultsMsg = document.querySelector('.no-search-results');
    
    if (visibleCards === 0 && searchTerm) {
        if (!noResultsMsg) {
            const msg = document.createElement('div');
            msg.className = 'no-search-results';
            msg.innerHTML = `
                <div style="text-align: center; padding: 50px; color: #7f8c8d;">
                    <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 20px;"></i>
                    <h3>No se encontraron resultados</h3>
                    <p>Intenta con otros términos de búsqueda</p>
                </div>
            `;
            document.querySelector('.news-grid').appendChild(msg);
        }
    } else if (noResultsMsg) {
        noResultsMsg.remove();
    }
}

// ===== FUNCIÓN PARA OBTENER CSRF TOKEN =====
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

// ===== LAZY LOADING MEJORADO =====
function setupLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    
                    if (img.dataset.src) {
                        // Mostrar placeholder de carga
                        img.style.opacity = '0.5';
                        
                        // Cargar imagen real
                        const tempImg = new Image();
                        tempImg.onload = () => {
                            img.src = tempImg.src;
                            img.style.opacity = '1';
                            img.removeAttribute('data-src');
                        };
                        tempImg.onerror = () => {
                            // Crear placeholder si falla la carga
                            const placeholder = document.createElement('div');
                            placeholder.className = 'image-placeholder';
                            placeholder.innerHTML = '<i class="fas fa-image"></i>';
                            img.parentElement.replaceChild(placeholder, img);
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

// ===== MANEJO DE ERRORES MEJORADO =====
function setupErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Error global:', e.error);
        showNotification('Ha ocurrido un error inesperado', 'error');
    });

    window.addEventListener('unhandledrejection', function(e) {
        console.error('Promise rechazada:', e.reason);
        showNotification('Error en la operación', 'error');
    });
}

// ===== NAVEGACIÓN MÓVIL MEJORADA =====
function setupMobileNavigation() {
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navWrapper = document.querySelector('.nav-wrapper');
    
    if (mobileToggle && navWrapper) {
        mobileToggle.addEventListener('click', () => {
            navWrapper.classList.toggle('active');
            
            // Cambiar icono del botón
            const icon = mobileToggle.querySelector('i');
            if (navWrapper.classList.contains('active')) {
                icon.className = 'fas fa-times';
            } else {
                icon.className = 'fas fa-bars';
            }
        });

        // Cerrar menú al hacer click en un enlace (móvil)
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    navWrapper.classList.remove('active');
                    mobileToggle.querySelector('i').className = 'fas fa-bars';
                }
            });
        });

        // Cerrar menú al hacer click fuera
        document.addEventListener('click', (e) => {
            if (!mobileToggle.contains(e.target) && !navWrapper.contains(e.target)) {
                navWrapper.classList.remove('active');
                mobileToggle.querySelector('i').className = 'fas fa-bars';
            }
        });
    }
}

// ===== MANEJO DE TECLADO PARA ACCESIBILIDAD =====
function setupKeyboardNavigation() {
    // Navegación por teclado en cards
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

    // Atajos de teclado
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + R para refresh
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            window.location.reload();
        }
        
        // Escape para cerrar notificaciones
        if (e.key === 'Escape') {
            const notification = document.querySelector('.notification');
            if (notification) {
                notification.remove();
            }
        }
    });
}

// ===== PERFORMANCE MONITORING =====
function setupPerformanceMonitoring() {
    if ('PerformanceObserver' in window) {
        // Monitor de pintado
        const paintObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    console.log(`FCP: ${entry.startTime}ms`);
                }
            }
        });
        
        try {
            paintObserver.observe({ entryTypes: ['paint'] });
        } catch (e) {
            console.log('Paint observer not supported');
        }
    }
}

// ===== INICIALIZACIÓN PRINCIPAL =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando portal de noticias...');
    
    try {
        // Inicializar todos los módulos
        assignCardSizes();
        setupImageHandling();
        initScrollAnimations();
        setupScrapingButtons();
        setupSearch();
        setupLazyLoading();
        setupErrorHandling();
        setupMobileNavigation();
        setupKeyboardNavigation();
        setupPerformanceMonitoring();
        
        console.log('✅ Portal de noticias inicializado correctamente');
        
        // Mostrar estadísticas de carga si está en desarrollo
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            const loadTime = performance.now();
            console.log(`⚡ Tiempo de inicialización: ${loadTime.toFixed(2)}ms`);
        }
        
    } catch (error) {
        console.error('❌ Error durante la inicialización:', error);
        showNotification('Error al cargar la página', 'error');
    }
});

// ===== SERVICE WORKER (OPCIONAL) =====
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registrado:', registration);
            })
            .catch(error => {
                console.log('SW falló:', error);
            });
    });
}

// ===== ANIMACIONES CSS ADICIONALES EN JS =====
const additionalStyles = `
    @keyframes slideInFromRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutToRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
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
        to {
            left: 100%;
        }
    }
`;

// Inyectar estilos adicionales
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// ===== UTILIDADES ADICIONALES =====

// Función para truncar texto si es necesario
window.truncateText = function(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
};

// Función para formatear fechas
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

// Función para scroll suave a elemento
window.smoothScrollTo = function(element) {
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
};

console.log('📰 Sistema de noticias cargado completamente');