// ===== GESTIÓN DE MEMORIA Y PERFORMANCE =====
function setupPerformanceMonitoring() {
    // Cleanup antes de recargar la página
    window.addEventListener('beforeunload', () => {
        if (window.cardLayoutManager) {
            window.cardLayoutManager.destroy();
        }
        if (window.filterManager) {
            window.filterManager.destroy();
        }
        if (window.notificationSystem) {
            window.notificationSystem.clearAll();
        }
    });
    
    // Monitor de performance (solo en desarrollo)
    if (window.location.hostname === 'localhost') {
        const observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                if (entry.loadTime > 1000) {
                    console.warn('🕐 Lento:', entry.name, entry.loadTime);
                }
            });
        });
        
        observer.observe({ entryTypes: ['navigation', 'resource'] });
    }
}

export { setupPerformanceMonitoring };