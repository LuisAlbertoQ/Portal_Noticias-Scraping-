import { domCache } from '../core/dom-cache.js';
import { appState } from '../core/app-state.js';
import { showNotification } from './notifications.js';
import { CONFIG } from '../core/config.js';

// ===== SCRAPING MANAGER MEJORADO =====
class ScrapingManager {
    constructor() {
        this.buttons = [
            { id: 'scraping-btn', endpoint: '/noticias/scraping/lista', category: 'general' },
            { id: 'scraping-tecnologia-btn', endpoint: '/noticias/scraping/tecnologia', category: 'tecnología' },
            { id: 'scraping-mundo-btn', endpoint: '/noticias/scraping/mundo', category: 'mundo' },
            { id: 'scraping-economia-btn', endpoint: '/noticias/scraping/economia', category: 'economía' },
            { id: 'scraping-politica-btn', endpoint: '/noticias/scraping/politica', category: 'política' },
            { id: 'scraping-lista-btn', endpoint: '/noticias/scraping/lista', category: 'lista' },
            { id: 'scraping-peru21-btn', endpoint: '/noticias/scraping/peru21', category: 'perugeneral' },
            { id: 'scraping-peru21-deportes-btn', endpoint: '/noticias/scraping/peru21/deportes', category: 'perudeportes' },
            { id: 'scraping-peru21-gastronomia-btn', endpoint: '/noticias/scraping/peru21/gastronomia', category: 'perugastronomia' },
            { id: 'scraping-peru21-investigacion-btn', endpoint: '/noticias/scraping/peru21/investigacion', category: 'peruinvestigacion' },
            { id: 'scraping-peru21-lima-btn', endpoint: '/noticias/scraping/peru21/lima', category: 'perulima' }
        ];
        
        this.activeRequests = new Map();
        this.currentTaskId = null;
    }
    
    init() {
        this.setupButtons();
        this.setupGlobalHandlers();
    }
    
    setupButtons() {
        this.buttons.forEach(({ id, endpoint, category }) => {
            const btn = domCache.get(`#${id}`);
            if (btn) {
                btn.addEventListener('click', () => this.handleScraping(btn, endpoint, category));
            }
        });
    }
    
    async handleScraping(button, endpoint, category) {
        const requestId = `scraping-${category}-${Date.now()}`;
        
        if (this.activeRequests.has(requestId)) {
            showNotification('Ya hay una solicitud de scraping en proceso', 'warning');
            return;
        }

        const originalHTML = button.innerHTML;
        const originalDisabled = button.disabled;

        try {
            appState.addPendingRequest(requestId);
            this.activeRequests.set(requestId, button);

            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scrapeando...';
            button.classList.add('loading', 'scraping-active');

            // MOSTRAR PANTALLA DE CARGA INMEDIATA
            this.showLoadingScreen(`Iniciando scraping de ${category}...`);

            const csrfToken = this.getCSRFToken();
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: `csrfmiddlewaretoken=${encodeURIComponent(csrfToken)}`,
                credentials: 'same-origin'
            });

            // Verificar respuesta
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                // Si es un error 403, lanzar un error específico
                if (response.status === 403) {
                    throw new Error('Permission denied');
                }

                const text = await response.text();
                throw new Error(`Respuesta no JSON: ${text.substring(0, 100)}...`);
            }

            const data = await response.json();

            if (!response.ok) {
                // Si es un error 403, lanzar un error específico
                if (response.status === 403) {
                    throw new Error('Permission denied');
                }
                throw new Error(data.message || `Error HTTP ${response.status}`);
            }

            if (data.status === 'ok') {
                // Tarea enviada a Celery - empezar polling
                showNotification(`Scraping de ${category} iniciado...`, 'info');
                this.currentTaskId = data.task_id;
                await this.monitorTaskCompletion(data.task_id, category);
                
            } else {
                throw new Error(data.message || data.error || 'Error desconocido');
            }

        } catch (error) {
            console.error(`Error en scraping (${category}):`, error);
            this.hideLoadingScreen();
            
            let errorMessage = 'Error en el scraping';
            if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Error de conexión. Verifica tu internet.';
            } else if (error.message.includes('403') || error.message.includes('Permission denied')) {
                // Mostrar una notificación simple de advertencia
                showNotification(`Para ejecutar scraping de ${category}, necesitas una cuenta Premium.`, 'warning');
                
                // MOSTRAR EL MODAL AUTOMÁTICAMENTE
                window.showUpgradeModal();
                errorMessage = 'Error de permisos. Recarga la página.';
            } else if (error.message.includes('Respuesta no JSON')) {
                errorMessage = 'Error en el servidor. La respuesta no es válida.';
            } else if (error.message.includes('TaskError')) {
                errorMessage = 'Error en la tarea de scraping. Inténtalo de nuevo.';
            }
            
            if (!error.message.includes('403') && !error.message.includes('Permission denied')) {
                showNotification(`${errorMessage}: ${category}`, 'error');
            }
            
            // Restaurar botón
            button.disabled = originalDisabled;
            button.innerHTML = originalHTML;
            button.classList.remove('loading', 'scraping-active');
            
        } finally {
            appState.removePendingRequest(requestId);
            this.activeRequests.delete(requestId);
        }
    }

    // 🔄 NUEVO: Monitorear tarea hasta que termine
    async monitorTaskCompletion(taskId, category) {
        const maxAttempts = 540; // 45 minutos (2s * 540 = 1080s = 18min) - AJUSTADO
        const checkInterval = 2000; // 2 segundos para ser más responsive
        let lastProgress = 0;
        let lastStatus = '';
        
        this.updateLoadingScreen(`Iniciando scraping de ${category}... (0%)`);

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const statusResponse = await fetch(`/noticias/scraping/task-status/${taskId}/`);
                
                if (!statusResponse.ok) {
                    throw new Error(`Error HTTP ${statusResponse.status}`);
                }
                
                const statusData = await statusResponse.json();
                // 🔍 AÑADE ESTE CONSOLE.LOG PARA DEPURAR
                console.log('🔍 DATOS RECIBIDOS DEL SERVIDOR:', statusData);

                // 🔍 DETECTAR CAMBIOS DE ESTADO
                if (statusData.status !== lastStatus) {
                    console.log(`🔄 Estado cambiado: ${lastStatus} -> ${statusData.status}`);
                    lastStatus = statusData.status;
                }

                // 🔍 DEBUG: Ver qué está recibiendo EXACTAMENTE
                console.log('🔍 STATUS DATA RECIBIDA:', {
                    status: statusData.status,
                    progress: statusData.progress,
                    articles_processed: statusData.progress?.articles_processed,
                    total_articles_found: statusData.progress?.total_articles_found,
                    current: statusData.progress?.current,
                    status_message: statusData.progress?.status
                });
                
                // 🔄 DETECTAR CAMBIOS DE ESTADO (de tu versión)
                if (statusData.status !== lastStatus) {
                    console.log(`🔄 Estado cambiado: ${lastStatus} -> ${statusData.status}`);
                    lastStatus = statusData.status;
                }
                
                // CALCULAR PROGRESO REAL (mejorado)
                const currentProgress = this.calculateProgress(attempt, maxAttempts, statusData);
                
                // ACTUALIZAR SOLO SI HAY CAMBIO SIGNIFICATIVO (nueva optimización)
                if (Math.abs(currentProgress - lastProgress) > 1 || attempt % 3 === 0) {
                    const statusMessage = this.getDetailedStatusMessage(statusData, category, currentProgress);
                    this.updateLoadingScreen(statusMessage);
                    lastProgress = currentProgress;
                }
                
                // MANEJAR ESTADOS DE CELERY (de tu versión, mejorada)
                if (statusData.status === 'SUCCESS' || statusData.completed) {
                    // ✅ Tarea completada EXITOSAMENTE
                    this.updateLoadingScreen(`¡Scraping de ${category} completado! Recargando... (100%)`);
                    showNotification(`¡Scraping de ${category} completado!`, 'success');
                    
                    setTimeout(() => {
                        this.hideLoadingScreen();
                        window.location.reload();
                    }, 1500);
                    return;
                    
                } else if (statusData.status === 'FAILURE' || statusData.failed) {
                    // ❌ Tarea falló
                    this.hideLoadingScreen();
                    const errorMsg = statusData.result || statusData.error || 'Error desconocido';
                    showNotification(`Error en scraping de ${category}: ${errorMsg}`, 'error');
                    return;
                    
                } else {
                    // ⏳ Tarea aún en progreso - lógica específica para PENDING (de tu versión)
                    if (statusData.status === 'PENDING' && attempt > 10) {
                        this.updateLoadingScreen(
                            `Scraping de ${category} en cola... (${currentProgress}%) - Esperando worker disponible`
                        );
                    }
                    
                    // Esperar antes del siguiente check
                    await new Promise(resolve => setTimeout(resolve, checkInterval));
                }
                
            } catch (error) {
                console.error('❌ Error checking task status:', error);
                
                // Continuar intentando pero con mensaje de error (de tu versión)
                const fallbackProgress = Math.round((attempt / maxAttempts) * 80);
                this.updateLoadingScreen(
                    `Scraping de ${category} en progreso... (${fallbackProgress}%) - Reconectando...`
                );
                
                await new Promise(resolve => setTimeout(resolve, checkInterval));
            }
        }
        
        // ✅ VERIFICACIÓN FINAL ANTES DE TIMEOUT (de tu versión - IMPORTANTE)
        try {
            const finalCheck = await fetch(`/noticias/scraping/task-status/${taskId}/`);
            const finalData = await finalCheck.json();
            
            if (finalData.status === 'SUCCESS' || finalData.completed) {
                this.updateLoadingScreen(`¡Scraping completado! Recargando...`);
                setTimeout(() => {
                    this.hideLoadingScreen();
                    window.location.reload();
                }, 1500);
                return;
            }
        } catch (e) {
            console.log('⏰ Verificación final falló:', e);
        }
        
        // ⏰ TIMEOUT REAL - Recargar de todos modos (de tu versión)
        this.hideLoadingScreen();
        showNotification(
            `El scraping de ${category} tardó demasiado tiempo. La página se recargará.`, 
            'warning'
        );
        
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }

    // 🔄 VERSIÓN MEJORADA - Progreso REAL
    calculateProgress(attempt, maxAttempts, statusData) {
        console.log('🔍 calculateProgress - statusData:', statusData);
        
        // PRIORIDAD 1: Progreso REAL desde Celery
        if (statusData.progress && typeof statusData.progress.current === 'number') {
            const progress = statusData.progress.current;
            console.log('✅ Usando progreso REAL de Celery:', progress);
            return Math.min(99, progress);
        }
        
        // PRIORIDAD 2: Progreso basado en noticias procesadas
        if (statusData.progress && statusData.progress.articles_processed > 0 && statusData.progress.total_articles_found > 0) {
            const articlesRatio = statusData.progress.articles_processed / statusData.progress.total_articles_found;
            const articlesProgress = 40 + (articlesRatio * 45); // 40% a 85%
            console.log('📊 Progreso por noticias:', articlesProgress);
            return Math.min(85, Math.round(articlesProgress));
        }
        
        // PRIORIDAD 3: Estados de Celery
        if (statusData.status === 'PROGRESS') {
            const timeBasedProgress = Math.round((attempt / maxAttempts) * 80) + 10;
            return Math.min(90, timeBasedProgress);
        }
        
        if (statusData.status === 'PENDING' || statusData.status === 'STARTED') {
            return Math.min(20, Math.round((attempt / 10) * 15));
        }
        
        // FALLBACK
        const timeBasedProgress = Math.round((attempt / maxAttempts) * 100);
        return Math.min(95, timeBasedProgress);
    }

    // 🔄 VERSIÓN CORREGIDA - Usar mensajes REALES de Celery
    getDetailedStatusMessage(statusData, category, progress) {
        console.log('🔍 getDetailedStatusMessage - statusData completo:', statusData);
        
        // PRIORIDAD 1: Mensaje ESPECÍFICO desde Celery (con números de noticias)
        if (statusData.progress && statusData.progress.status) {
            console.log('✅ Usando mensaje REAL de Celery:', statusData.progress.status);
            return `${statusData.progress.status} (${progress}%)`;
        }
        
        // PRIORIDAD 2: Si hay datos de noticias, crear mensaje específico
        if (statusData.progress && statusData.progress.articles_processed > 0) {
            const articlesProcessed = statusData.progress.articles_processed || 0;
            const totalArticles = statusData.progress.total_articles_found || 0;
            
            if (totalArticles > 0) {
                const articleMessage = `Procesando noticias (${articlesProcessed}/${totalArticles})`;
                console.log('📊 Mensaje con noticias:', articleMessage);
                return `${articleMessage} (${progress}%)`;
            }
        }
        
        // PRIORIDAD 3: Estados de Celery con mensajes mejorados
        if (statusData.status === 'PENDING') {
            return `Scraping de ${category} en cola... (${progress}%)`;
        }
        else if (statusData.status === 'STARTED') {
            return `Iniciando scraping de ${category}... (${progress}%)`;
        }
        else if (statusData.status === 'PROGRESS') {
            // Mensajes basados en progreso PERO con posibilidad de noticias
            if (progress < 30) return `Navegando y cargando páginas... (${progress}%)`;
            if (progress < 60) return `Extrayendo contenido... (${progress}%)`;
            if (progress < 85) return `Procesando noticias... (${progress}%)`;
            return `Guardando en base de datos... (${progress}%)`;
        }
        
        // FALLBACK
        return `Scraping de ${category} en progreso... (${progress}%)`;
    }

    getStatusMessage(status, category) {
        const messages = {
            'PENDING': `Scraping de ${category} en cola...`,
            'STARTED': `Scraping de ${category} iniciado...`,
            'PROGRESS': `Scraping de ${category} en progreso...`,
            'SUCCESS': `¡Scraping de ${category} completado!`,
            'FAILURE': `Error en scraping de ${category}`
        };
        return messages[status] || `Scraping de ${category} en progreso...`;
    }

    // 🖥️ NUEVO: Pantalla de carga completa
    showLoadingScreen(message = 'Procesando...') {
        // Crear o reutilizar overlay
        let overlay = document.getElementById('scraping-overlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'scraping-overlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.98);
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                font-family: Arial, sans-serif;
                backdrop-filter: blur(5px);
            `;
            
            overlay.innerHTML = `
                <div class="loading-content" style="text-align: center; max-width: 500px; padding: 20px;">
                    <div class="spinner" style="font-size: 48px; color: #3498db; margin-bottom: 20px;">
                        <i class="fas fa-sync fa-spin"></i>
                    </div>
                    <div class="loading-message" style="font-size: 20px; color: #2c3e50; margin-bottom: 15px; font-weight: 500;">
                        ${message}
                    </div>
                    <div class="loading-details" style="font-size: 14px; color: #7f8c8d; margin-bottom: 20px;">
                        Por favor, espere mientras se completa el scraping...
                    </div>
                    <div class="progress-container" style="width: 100%; max-width: 400px; margin: 0 auto;">
                        <div class="progress-bar" style="width: 100%; height: 6px; background: #ecf0f1; border-radius: 3px; overflow: hidden;">
                            <div class="progress-fill" style="width: 0%; height: 100%; background: linear-gradient(90deg, #3498db, #2ecc71); transition: width 0.5s ease;"></div>
                        </div>
                        <div class="progress-text" style="font-size: 12px; color: #95a5a6; margin-top: 5px; text-align: center;">
                            Iniciando...
                        </div>
                    </div>
                    <div class="loading-note" style="font-size: 12px; color: #bdc3c7; margin-top: 25px; font-style: italic;">
                        La página se recargará automáticamente cuando termine
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            document.body.style.overflow = 'hidden';
        }
        
        this.updateLoadingScreen(message);
    }

    updateLoadingScreen(message) {
        const messageEl = document.querySelector('#scraping-overlay .loading-message');
        const progressText = document.querySelector('#scraping-overlay .progress-text');
        
        if (messageEl) {
            messageEl.textContent = message;
        }
        
        if (progressText && message.includes('%')) {
            const progressMatch = message.match(/\((\d+)%\)/);
            if (progressMatch) {
                const progress = progressMatch[1];
                progressText.textContent = `Progreso: ${progress}%`;
                
                // Actualizar barra de progreso
                const progressFill = document.querySelector('#scraping-overlay .progress-fill');
                if (progressFill) {
                    progressFill.style.width = `${progress}%`;
                }
            }
        }
    }

    hideLoadingScreen() {
        const overlay = document.getElementById('scraping-overlay');
        if (overlay) {
            // Animación de desvanecimiento
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';
            
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                document.body.style.overflow = '';
            }, 300);
        }
    }
    
    getCSRFToken() {
        // Método 1: Buscar en las cookies
        const cookieToken = getCookie('csrftoken');
        if (cookieToken) return cookieToken;
        
        // Método 2: Buscar en el meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]');
        if (metaToken) return metaToken.getAttribute('content');
        
        // Método 3: Buscar en el form
        const formToken = document.querySelector('[name=csrfmiddlewaretoken]');
        if (formToken) return formToken.value;
        
        console.error('No se pudo encontrar el token CSRF');
        showNotification('Error de seguridad: no se pudo verificar la solicitud', 'error');
        return '';
    }
    
    async fetchWithTimeout(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                credentials: 'same-origin'
            });
            
            clearTimeout(timeoutId);
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }
    showPermissionDeniedNotification(category) {
        // Crear notificación personalizada para permisos denegados
        const notificationId = `permission-denied-${Date.now()}`;
        
        // Crear HTML de la notificación
        const notificationHTML = `
            <div id="${notificationId}" class="notification permission-denied" style="
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
                background: #f39c12;
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                display: flex;
                flex-direction: column;
                gap: 10px;
                animation: slideInFromRight 0.3s ease;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 20px;"></i>
                    <span style="font-weight: 500;">Permiso denegado</span>
                    <button class="notification-close" style="
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        font-size: 16px;
                        margin-left: auto;
                    ">&times;</button>
                </div>
                <div style="font-size: 14px;">
                    Para ejecutar scraping de ${category}, necesitas una cuenta Premium.
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-upgrade" style="
                        background: rgba(255,255,255,0.2);
                        border: 1px solid white;
                        color: white;
                        cursor: pointer;
                        font-size: 14px;
                        padding: 5px 10px;
                        border-radius: 5px;
                    ">Actualizar a Premium</button>
                </div>
            </div>
        `;
        
        // Añadir al DOM
        document.body.insertAdjacentHTML('beforeend', notificationHTML);
        
        // Configurar eventos
        const notification = document.getElementById(notificationId);
        const closeBtn = notification.querySelector('.notification-close');
        const upgradeBtn = notification.querySelector('.btn-upgrade');
        
        // Cerrar al hacer click en la X
        closeBtn.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        // Redirigir al hacer click en "Actualizar a Premium"
        upgradeBtn.addEventListener('click', () => {
            window.location.href = '/accounts/upgrade/';
        });
        
        // Auto-eliminar después de 10 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                notification.style.opacity = '0';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, 10000);
    }
    
    setupGlobalHandlers() {
        // Cancelar todas las solicitudes al salir de la página
        window.addEventListener('beforeunload', () => {
            this.activeRequests.forEach((button, requestId) => {
                appState.removePendingRequest(requestId);
            });
            this.hideLoadingScreen();
        });
        
        // También permitir cerrar con Escape (para desarrollo)
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('scraping-overlay')) {
                if (confirm('¿Cancelar el scraping en curso?')) {
                    this.hideLoadingScreen();
                    this.cancelAll();
                    showNotification('Scraping cancelado por el usuario', 'warning');
                }
            }
        });
    }
    
    cancelAll() {
        this.activeRequests.forEach((button, requestId) => {
            appState.removePendingRequest(requestId);
            button.disabled = false;
            button.innerHTML = 'Scraping';
            button.classList.remove('loading', 'scraping-active');
        });
        this.activeRequests.clear();
        this.currentTaskId = null;
    }
}

// Función para CSRF Token
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export { ScrapingManager, getCookie };