// ===== MANEJO DE ERRORES MEJORADO =====
function setupErrorHandling() {
    // Error global
    window.addEventListener('error', function(e) {
        console.error('Error global:', e.error);
        // En producción, podrías enviar esto a un servicio de tracking
        if (window.location.hostname !== 'localhost') {
            // trackError(e.error);
        }
    });

    // Promise rejections
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Promise rechazada:', e.reason);
        e.preventDefault(); // Prevenir log en consola
    });

    // Error en carga de recursos
    window.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            const img = e.target;
            img.style.opacity = '0';
            setTimeout(() => {
                const placeholder = document.createElement('div');
                placeholder.className = 'image-placeholder';
                placeholder.innerHTML = '<i class="fas fa-image"></i>';
                img.parentNode.replaceChild(placeholder, img);
            }, 300);
        }
    }, true);
}

export { setupErrorHandling };