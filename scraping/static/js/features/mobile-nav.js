import { domCache } from '../core/dom-cache.js';

// ===== NAVEGACIÓN MÓVIL MEJORADA =====
function setupMobileNavigation() {
    const mobileToggle = domCache.get('.mobile-toggle');
    const navWrapper = domCache.get('.nav-wrapper');
    
    if (!mobileToggle || !navWrapper) return;
    
    let isAnimating = false;
    
    mobileToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        
        if (isAnimating) return;
        isAnimating = true;
        
        navWrapper.classList.toggle('active');
        
        const icon = mobileToggle.querySelector('i');
        if (navWrapper.classList.contains('active')) {
            icon.className = 'fas fa-times';
            document.body.style.overflow = 'hidden';
        } else {
            icon.className = 'fas fa-bars';
            document.body.style.overflow = '';
        }
        
        setTimeout(() => {
            isAnimating = false;
        }, 300);
    });

    // Cerrar al hacer click en un link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && navWrapper.classList.contains('active')) {
                navWrapper.classList.remove('active');
                mobileToggle.querySelector('i').className = 'fas fa-bars';
                document.body.style.overflow = '';
            }
        });
    });

    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!mobileToggle.contains(e.target) && !navWrapper.contains(e.target)) {
            if (navWrapper.classList.contains('active')) {
                navWrapper.classList.remove('active');
                mobileToggle.querySelector('i').className = 'fas fa-bars';
                document.body.style.overflow = '';
            }
        }
    });
    
    // Cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navWrapper.classList.contains('active')) {
            navWrapper.classList.remove('active');
            mobileToggle.querySelector('i').className = 'fas fa-bars';
            document.body.style.overflow = '';
        }
    });
}

export { setupMobileNavigation };