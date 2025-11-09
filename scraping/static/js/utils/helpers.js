import { showNotification } from '../components/notifications.js';

// ===== FUNCIONES GLOBALES MEJORADAS =====
function compartirNoticia(titulo, enlace) {
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
}

function fallbackShare(texto, url) {
    const shareText = `${texto}\n${url}`;
    
    if (navigator.clipboard && !isMobileDevice()) {
        navigator.clipboard.writeText(shareText)
            .then(() => {
                showNotification('¡Enlace copiado al portapapeles!', 'success');
            })
            .catch(() => {
                legacyCopy(shareText);
            });
    } else {
        legacyCopy(shareText);
    }
}

function legacyCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.cssText = `
        position: fixed;
        left: -9999px;
        opacity: 0;
        pointer-events: none;
    `;
    
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
            showNotification('¡Enlace copiado al portapapeles!', 'success');
        } else {
            showNotification('No se pudo copiar el enlace', 'error');
        }
    } catch (err) {
        document.body.removeChild(textArea);
        showNotification('Error al copiar el enlace', 'error');
    }
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text || '';
    
    // Mantener palabras completas
    const truncated = text.slice(0, maxLength);
    return truncated.slice(0, truncated.lastIndexOf(' ')) + '...';
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    
    if (diffMinutes < 60) {
        return `Hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
        return `Hace ${diffHours} h`;
    } else if (diffDays === 1) {
        return 'Ayer';
    } else if (diffDays < 7) {
        return `Hace ${diffDays} días`;
    }
    
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function smoothScrollTo(element) {
    if (!element) return;
    
    element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

export {
    compartirNoticia,
    fallbackShare,
    legacyCopy,
    isMobileDevice,
    truncateText,
    formatDate,
    smoothScrollTo,
    debounce
};