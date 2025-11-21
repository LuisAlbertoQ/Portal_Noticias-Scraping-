// Formatear número de tarjeta
const upgCardNumber = document.getElementById('card-number');
if (upgCardNumber) {
    upgCardNumber.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\s/g, '');
        let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
        e.target.value = formattedValue;
    });
}

// Formatear fecha de vencimiento
const upgCardExpiry = document.getElementById('card-expiry');
if (upgCardExpiry) {
    upgCardExpiry.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        e.target.value = value;
    });
}
