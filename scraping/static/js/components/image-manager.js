import { domCache } from '../core/dom-cache.js';
import { CONFIG } from '../core/config.js';

// ===== MANEJO DE IMÁGENES MEJORADO =====
class ImageManager {
    constructor() {
        this.observer = null;
        this.failedImages = new Set();
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.setupImageErrorHandling();
    }
    
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            this.loadAllImages();
            return;
        }
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: CONFIG.LAZY_LOAD_THRESHOLD,
            rootMargin: CONFIG.LAZY_LOAD_ROOT_MARGIN
        });
        
        this.observeImages();
    }
    
    observeImages() {
        const images = domCache.getAll('img[data-src]');
        images.forEach(img => {
            if (!this.failedImages.has(img.dataset.src)) {
                this.observer.observe(img);
            }
        });
    }
    
    loadImage(img) {
        const src = img.dataset.src;
        if (!src || this.failedImages.has(src)) return;
        
        img.style.opacity = '0.5';
        img.style.transition = 'opacity 0.3s ease';
        
        const tempImg = new Image();
        tempImg.onload = () => {
            img.src = src;
            img.removeAttribute('data-src');
            img.style.opacity = '1';
            img.closest('.image-container')?.classList.add('loaded');
            
            // Mejorar performance
            setTimeout(() => {
                img.style.transition = '';
            }, 300);
        };
        
        tempImg.onerror = () => {
            this.failedImages.add(src);
            this.showPlaceholder(img);
        };
        
        tempImg.src = src;
    }
    
    showPlaceholder(img) {
        const container = img.closest('.image-container');
        if (!container) return;
        
        const placeholder = document.createElement('div');
        placeholder.className = 'image-placeholder';
        placeholder.innerHTML = '<i class="fas fa-image"></i>';
        placeholder.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8f9fa;
            color: #6c757d;
            font-size: 24px;
            width: 100%;
            height: 100%;
            min-height: 150px;
        `;
        
        container.replaceChild(placeholder, img);
    }
    
    loadAllImages() {
        const images = domCache.getAll('img[data-src]');
        images.forEach(img => this.loadImage(img));
    }
    
    setupImageErrorHandling() {
        // Manejar errores de imágenes que no cargan
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG' && e.target.hasAttribute('data-src')) {
                this.failedImages.add(e.target.dataset.src);
                this.showPlaceholder(e.target);
            }
        }, true);
    }
    
    refresh() {
        this.failedImages.clear();
        domCache.clear('img[data-src]');
        this.observeImages();
    }
}

export { ImageManager };