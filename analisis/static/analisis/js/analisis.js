// analisis/static/analisis/js/analisis.js
class AnalisisManager {
    constructor() {
        this.pollInterval = null;
        this.initEventListeners();
    }

    initEventListeners() {
        // Delegación de eventos para botones .analyze-btn
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.analyze-btn');
            if (btn) {
                e.preventDefault();

                // Comprobación de permisos en el cliente: si no está autenticado, redirigir al login
                try {
                    if (!window.IS_AUTH) {
                        // Mantener next para volver a la misma página
                        const next = encodeURIComponent(window.location.pathname + window.location.search);
                        window.location.href = `/accounts/login/?next=${next}`;
                        return;
                    }

                    // Si no es premium ni admin ni staff, mostrar notificación y modal de upgrade
                    const role = (window.CURRENT_USER_ROLE || 'anonymous').toString();
                    const isStaff = !!window.IS_STAFF;
                    if (role !== 'premium' && role !== 'admin' && !isStaff) {
                        // Usar el sistema de notificaciones global si existe, con varios fallbacks
                        const notify = (msg, type = 'info') => {
                            try {
                                if (typeof showNotification === 'function') {
                                    showNotification(msg, type);
                                    return;
                                }
                            } catch (e) {}

                            try {
                                if (window.notificationSystem && typeof window.notificationSystem.show === 'function') {
                                    window.notificationSystem.show(msg, type);
                                    return;
                                }
                            } catch (e) {}

                            // Último recurso: alert
                            try { alert(msg); } catch (e) { console.log('Notify:', msg); }
                        };

                        notify('Para usar el análisis necesitas una cuenta Premium.', 'warning');

                        // Abrir modal de upgrade si está definido
                        if (typeof window.showUpgradeModal === 'function') {
                            window.showUpgradeModal();
                        }

                        return; // no iniciar el análisis
                    }

                } catch (err) {
                    console.warn('Error comprobando permisos cliente:', err);
                }

                this.iniciarAnalisis(btn);
            }
        });
    }

    async iniciarAnalisis(btn) {
        const noticiaId = btn.dataset.noticiaId;
        const originalHTML = btn.innerHTML;
        
        // 1. Deshabilitar botón y mostrar spinner
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Analizando...</span>';
        
        try {
            // 2. Verificar si ya existe análisis
            const existe = await this.verificarAnalisisExistente(noticiaId);
            if (existe.status === 'existe') {
                this.mostrarResultado(existe.analisis_id);
                this.restaurarBoton(btn, originalHTML);
                return;
            }
            // Preparar headers con CSRF token
            const headers = {
                'X-CSRFToken': this.getCSRFToken(),
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };

            // 3. Iniciar análisis
            const response = await fetch(`/analisis/api/iniciar/${noticiaId}/`, {
                method: 'POST',
                headers: headers,
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.status === 'ok' && data.task_id) {
                this.monitorizarProgreso(data.task_id, btn, originalHTML);
            } else if (data.status === 'existe') {
                this.mostrarResultado(data.analisis_id);
                this.restaurarBoton(btn, originalHTML);
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
            
        } catch (error) {
            console.error('Error:', error);
            this.mostrarError(btn, 'Error de conexión');
            this.restaurarBoton(btn, originalHTML);
        }
    }

    async verificarAnalisisExistente(noticiaId) {
        try {
            const response = await fetch(`/analisis/api/ultimo/${noticiaId}/`);
            return await response.json();
        } catch (e) {
            return {status: 'no_existe'};
        }
    }

    monitorizarProgreso(taskId, btn, originalHTML) {
        let attempts = 0;
        const maxAttempts = 60; // 2 minutos de polling
        
        this.pollInterval = setInterval(async () => {
            attempts++;
            
            try {
                const response = await fetch(`/analisis/api/estado/${taskId}/`);
                const data = await response.json();
                
                if (data.completed) {
                    clearInterval(this.pollInterval);
                    
                    if (data.success) {
                        btn.classList.remove('btn-warning');
                        btn.classList.add('btn-success');
                        btn.innerHTML = '<i class="fas fa-check-circle"></i> <span>Analizada</span>';
                        this.mostrarResultado(data.analisis_id);
                    } else {
                        this.mostrarError(btn, data.error || 'Error en el análisis');
                        this.restaurarBoton(btn, originalHTML);
                    }
                } else {
                    // Actualizar progreso
                    const progress = data.progress || {};
                    const percent = Math.round((progress.current || 0) / (progress.total || 100) * 100);
                    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>${percent}%...</span>`;
                }
                
                if (attempts >= maxAttempts) {
                    clearInterval(this.pollInterval);
                    this.mostrarError(btn, 'Tiempo de espera agotado');
                    this.restaurarBoton(btn, originalHTML);
                }
                
            } catch (error) {
                console.error('Error en polling:', error);
            }
        }, 2000); // Polling cada 2 segundos
    }

    mostrarResultado(analisisId) {
        // Opción 1: Redirigir a página de resultado
        window.open(`/analisis/resultado/${analisisId}/`, '_blank');
        
        // Opción 2: Modal (requiere más HTML/CSS)
        // this.mostrarModal(analisisId);
    }

    mostrarError(btn, mensaje) {
        // Crear tooltip de error
        btn.setAttribute('title', mensaje);
        btn.classList.add('btn-danger');
        setTimeout(() => {
            btn.classList.remove('btn-danger');
            btn.removeAttribute('title');
        }, 3000);
    }

    restaurarBoton(btn, originalHTML) {
        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }

    getCSRFToken() {
        // Múltiples métodos para obtener el token
        let cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
        if (cookie) return cookie.split('=')[1];
        
        // Alternativa: buscar en meta tags
        const meta = document.querySelector('meta[name="csrf-token"]');
        if (meta) return meta.content;
        
        console.warn('CSRF token no encontrado');
        return '';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    new AnalisisManager();
});