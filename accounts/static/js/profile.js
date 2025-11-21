// Funciones para manejar el modal de cancelación
function showCancelModal() {
    document.getElementById('cancel-modal').style.display = 'block';
    // Prevenir el scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
}

function closeCancelModal() {
    document.getElementById('cancel-modal').style.display = 'none';
    // Restaurar el scroll del body cuando el modal se cierra
    document.body.style.overflow = 'auto';
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('cancel-modal');
    if (event.target == modal) {
        closeCancelModal();
    }
}

// Cerrar modal al hacer clic en la X
document.querySelector('.close-modal').onclick = function() {
    closeCancelModal();
}