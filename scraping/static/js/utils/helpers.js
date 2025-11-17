// ===== FUNCIONES GLOBALES MEJORADAS =====
async function compartirNoticia(titulo, enlace, noticiaId = null) {
    const url = enlace || window.location.href;
    const texto = `📰 ${titulo}`;
    let plataforma = 'general';
    
    if (navigator.share) {
        try {
            await navigator.share({
                title: titulo,
                text: texto,
                url: url
            });
            plataforma = 'navigator_share';
            
            // Registrar el compartir exitoso
            if (noticiaId) {
                await registrarCompartirActividad(noticiaId, plataforma);
            }
            
        } catch (err) {
            if (err.name !== 'AbortError') {
                await fallbackShare(texto, url, noticiaId);
            }
        }
    } else {
        await fallbackShare(texto, url, noticiaId);
    }
}

async function fallbackShare(texto, url, noticiaId = null) {
    const shareText = `${texto}\n${url}`;
    let plataforma = 'clipboard';
    
    if (navigator.clipboard && !isMobileDevice()) {
        try {
            await navigator.clipboard.writeText(shareText);
            showNotification('¡Enlace copiado al portapapeles!', 'success');
            
            // Registrar compartir por clipboard
            if (noticiaId) {
                await registrarCompartirActividad(noticiaId, plataforma);
            }
            
        } catch (err) {
            plataforma = 'legacy_copy';
            await legacyCopy(shareText, noticiaId, plataforma);
        }
    } else {
        plataforma = 'legacy_copy';
        await legacyCopy(shareText, noticiaId, plataforma);
    }
}

async function legacyCopy(text, noticiaId = null, plataforma = 'legacy_copy') {
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
            
            // Registrar compartir exitoso
            if (noticiaId) {
                await registrarCompartirActividad(noticiaId, plataforma);
            }
        } else {
            showNotification('No se pudo copiar el enlace', 'error');
        }
    } catch (err) {
        document.body.removeChild(textArea);
        showNotification('Error al copiar el enlace', 'error');
    }
}

// Nueva función para registrar la actividad de compartir
async function registrarCompartirActividad(noticiaId, plataforma) {
    try {
        const formData = new FormData();
        formData.append('csrfmiddlewaretoken', document.querySelector('[name=csrfmiddlewaretoken]').value);
        formData.append('plataforma', plataforma);
        
        const response = await fetch(`/noticias/registrar-compartir/${noticiaId}/`, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            console.log('Compartir registrado correctamente:', data.plataforma);
        } else {
            console.error('Error al registrar compartir:', data.message);
        }
    } catch (error) {
        console.error('Error de red al registrar compartir:', error);
    }
}

// Función para detectar la plataforma de compartir (opcional)
function detectarPlataformaCompartir() {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('whatsapp')) return 'whatsapp';
    if (userAgent.includes('facebook')) return 'facebook';
    if (userAgent.includes('twitter')) return 'twitter';
    if (userAgent.includes('linkedin')) return 'linkedin';
    if (userAgent.includes('telegram')) return 'telegram';
    
    return 'web';
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
    registrarCompartirActividad,
    detectarPlataformaCompartir,
    isMobileDevice,
    truncateText,
    formatDate,
    smoothScrollTo,
    debounce
};