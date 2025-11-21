import { CONFIG } from '../core/config.js';

// ===== SISTEMA DE NOTIFICACIONES MEJORADO =====
class NotificationSystem {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isShowing = false;
        this.init();
    }
    
    init() {
        // Crear contenedor de notificaciones
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
        const notification = {
            id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message,
            type,
            duration,
            timestamp: Date.now()
        };
        
        this.queue.push(notification);
        this.processQueue();
    }
    
    // Método especial para notificaciones de permisos
    showPermissionNotification(message, actionCallback) {
        const notification = {
            id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message,
            type: 'warning',
            duration: 8000, // Más tiempo para notificaciones de permisos
            timestamp: Date.now(),
            action: {
                text: 'Actualizar a Premium',
                callback: actionCallback
            }
        };
        
        this.queue.push(notification);
        this.processQueue();
    }
    
    processQueue() {
        if (this.isShowing || this.queue.length === 0) return;
        
        this.isShowing = true;
        const notification = this.queue.shift();
        this.createNotificationElement(notification);
    }
    
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.id = notification.id;
        element.className = `notification ${notification.type}`;
        
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        element.style.cssText = `
            background: ${colors[notification.type] || colors.info};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            animation: slideInFromRight 0.3s ease;
            max-width: 350px;
            font-weight: 500;
            pointer-events: auto;
            transform: translateX(0);
            transition: transform 0.3s ease, opacity 0.3s ease;
        `;
        
        let actionButton = '';
        if (notification.action) {
            actionButton = `<button class="notification-action" style="background: rgba(255,255,255,0.2); border: 1px solid white; color: white; cursor: pointer; font-size: 14px; padding: 5px 10px; border-radius: 5px;">${notification.action.text}</button>`;
        }
        
        element.innerHTML = `
            <i class="fas ${this.getIconForType(notification.type)}"></i>
            <span style="flex: 1;">${notification.message}</span>
            ${actionButton}
            <button class="notification-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">&times;</button>
        `;
        
        this.container.appendChild(element);
        
        const closeBtn = element.querySelector('.notification-close');
        this.setupNotificationEvents(element, closeBtn, notification);
        
        // Configurar evento para el botón de acción si existe
        if (notification.action) {
            const actionBtn = element.querySelector('.notification-action');
            actionBtn.addEventListener('click', () => {
                clearTimeout(element._autoRemoveTimer);
                this.removeNotification(element);
                notification.action.callback();
            });
        }
        
        // Auto-remove
        const autoRemove = setTimeout(() => {
            this.removeNotification(element);
        }, notification.duration);
        
        // Guardar timer para cleanup
        element._autoRemoveTimer = autoRemove;
    }
    
    setupNotificationEvents(element, closeBtn, notification) {
        // Cerrar al hacer click
        closeBtn.addEventListener('click', () => {
            clearTimeout(element._autoRemoveTimer);
            this.removeNotification(element);
        });
        
        // Pausar en hover
        element.addEventListener('mouseenter', () => {
            clearTimeout(element._autoRemoveTimer);
        });
        
        element.addEventListener('mouseleave', () => {
            clearTimeout(element._autoRemoveTimer);
            element._autoRemoveTimer = setTimeout(() => {
                this.removeNotification(element);
            }, notification.duration);
        });
    }
    
    removeNotification(element) {
        if (!element || !element.parentNode) return;
        
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.isShowing = false;
            this.processQueue();
        }, 300);
    }
    
    getIconForType(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }
    
    clearAll() {
        this.queue = [];
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach(notification => {
            clearTimeout(notification._autoRemoveTimer);
            this.removeNotification(notification);
        });
    }
}

// Inicializar sistema de notificaciones
const notificationSystem = new NotificationSystem();

// Función global mejorada
function showNotification(message, type = 'info') {
    notificationSystem.show(message, type);
}

export { notificationSystem, showNotification, NotificationSystem };