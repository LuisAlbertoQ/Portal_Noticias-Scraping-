function showPaymentModal() {
    document.getElementById('payment-modal').style.display = 'block';
    // Prevenir el scroll del body cuando el modal está abierto
    document.body.style.overflow = 'hidden';
}

function closePaymentModal() {
    document.getElementById('payment-modal').style.display = 'none';
    // Restaurar el scroll del body cuando el modal se cierra
    document.body.style.overflow = 'auto';
}

// Cerrar modal al hacer clic fuera de él
window.onclick = function(event) {
    const modal = document.getElementById('payment-modal');
    if (event.target == modal) {
        closePaymentModal();
    }
}

// Cerrar modal al hacer clic en la X
const closeModalBtn = document.querySelector('.close-modal');
if (closeModalBtn) {
    closeModalBtn.onclick = function() {
        closePaymentModal();
    }
}

// Formatear número de tarjeta
const cardNumberEl = document.getElementById('card-number');
if (cardNumberEl) {
    cardNumberEl.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });
}

// Formatear fecha de vencimiento
const cardExpiryEl = document.getElementById('card-expiry');
if (cardExpiryEl) {
    cardExpiryEl.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
}
