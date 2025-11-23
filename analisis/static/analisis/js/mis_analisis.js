// ===== FUNCIONALIDADES PARA MIS ANÁLISIS =====

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de análisis cargada correctamente');
    
    // Inicializar animaciones
    initializeAnimations();
    
    // Inicializar filtros
    initializeFilters();
    
    // Inicializar toggle de vista
    initializeViewToggle();
    
    // Inicializar paginación con AJAX (opcional)
    initializePagination();
});

/**
 * Inicializa las animaciones de las cards
 */
function initializeAnimations() {
    // Las cards ya tienen animación CSS con animation-delay
    const cards = document.querySelectorAll('.analisis-card');
    console.log(`Se encontraron ${cards.length} cards de análisis`);
}

/**
 * Inicializa los filtros por estado
 */
function initializeFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.dataset.filter;
            
            // Actualizar botones activos
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Filtrar cards
            const cards = document.querySelectorAll('.analisis-card');
            let visibleCount = 0;
            
            cards.forEach(card => {
                if (filter === 'all' || card.dataset.status === filter) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });
            
            // Mostrar mensaje si no hay resultados
            showEmptyStateMessage(visibleCount === 0);
        });
    });
}

/**
 * Inicializa el toggle entre vista de grid y lista
 */
function initializeViewToggle() {
    const viewToggleButtons = document.querySelectorAll('.view-toggle-btn');
    
    viewToggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Actualizar botones activos
            viewToggleButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Cambiar vista
            const grid = document.querySelector('.analisis-grid');
            if (view === 'list') {
                grid.classList.add('list-view');
            } else {
                grid.classList.remove('list-view');
            }
            
            // Guardar preferencia en localStorage
            localStorage.setItem('mis_analisis_view', view);
        });
    });
    
    // Restaurar preferencia de vista
    const savedView = localStorage.getItem('mis_analisis_view');
    if (savedView) {
        const grid = document.querySelector('.analisis-grid');
        const button = document.querySelector(`.view-toggle-btn[data-view="${savedView}"]`);
        
        if (grid && button) {
            grid.classList.toggle('list-view', savedView === 'list');
            viewToggleButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        }
    }
}

/**
 * Inicializa la paginación con AJAX (opcional)
 */
function initializePagination() {
    const paginationLinks = document.querySelectorAll('.pagination a');
    
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Solo si se quiere paginación con AJAX
            // e.preventDefault();
            // loadPage(this.href);
        });
    });
}

/**
 * Muestra u oculta el mensaje de estado vacío
 */
function showEmptyStateMessage(show) {
    let emptyStateMessage = document.querySelector('.empty-state-message');
    
    if (show && !emptyStateMessage) {
        // Crear mensaje de estado vacío
        emptyStateMessage = document.createElement('div');
        emptyStateMessage.className = 'empty-state-message';
        emptyStateMessage.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-filter fa-3x text-muted mb-3"></i>
                <h4>No hay análisis con este filtro</h4>
                <p>Intenta con otro filtro o <a href="#" class="reset-filter">restablecer los filtros</a></p>
            </div>
        `;
        
        // Añadir después de los filtros
        const filterContainer = document.querySelector('.d-flex.justify-content-between');
        if (filterContainer) {
            filterContainer.after(emptyStateMessage);
        }
        
        // Añadir evento para resetear filtros
        const resetLink = emptyStateMessage.querySelector('.reset-filter');
        if (resetLink) {
            resetLink.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelector('.filter-btn[data-filter="all"]').click();
            });
        }
    } else if (!show && emptyStateMessage) {
        // Eliminar mensaje de estado vacío
        emptyStateMessage.remove();
    }
}

/**
 * Carga una página con AJAX (opcional)
 */
function loadPage(url) {
    // Mostrar indicador de carga
    showLoadingIndicator();
    
    fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.text())
    .then(html => {
        // Actualizar solo el contenido principal
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newContent = doc.querySelector('.analisis-grid');
        const currentContent = document.querySelector('.analisis-grid');
        
        if (newContent && currentContent) {
            currentContent.innerHTML = newContent.innerHTML;
            
            // Actualizar la paginación
            const newPagination = doc.querySelector('.pagination');
            const currentPagination = document.querySelector('.pagination');
            
            if (newPagination && currentPagination) {
                currentPagination.innerHTML = newPagination.innerHTML;
            }
            
            // Reinicializar scripts
            initializeAnimations();
            initializeFilters();
            
            // Scroll al inicio de la lista
            window.scrollTo({
                top: document.querySelector('.analisis-grid').offsetTop - 100,
                behavior: 'smooth'
            });
        }
        
        hideLoadingIndicator();
    })
    .catch(error => {
        console.error('Error loading page:', error);
        hideLoadingIndicator();
        showErrorMessage('Error al cargar la página. Por favor, inténtalo de nuevo.');
    });
}

/**
 * Muestra un indicador de carga
 */
function showLoadingIndicator() {
    let loadingIndicator = document.querySelector('.loading-indicator');
    
    if (!loadingIndicator) {
        loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-spinner fa-spin fa-2x text-primary"></i>
                <p class="mt-2">Cargando...</p>
            </div>
        `;
        
        const grid = document.querySelector('.analisis-grid');
        if (grid) {
            grid.after(loadingIndicator);
        }
    }
}

/**
 * Oculta el indicador de carga
 */
function hideLoadingIndicator() {
    const loadingIndicator = document.querySelector('.loading-indicator');
    if (loadingIndicator) {
        loadingIndicator.remove();
    }
}

/**
 * Muestra un mensaje de error
 */
function showErrorMessage(message) {
    let errorMessage = document.querySelector('.error-message');
    
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message alert alert-danger';
        
        const grid = document.querySelector('.analisis-grid');
        if (grid) {
            grid.after(errorMessage);
        }
    }
    
    errorMessage.textContent = message;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        errorMessage.remove();
    }, 5000);
}