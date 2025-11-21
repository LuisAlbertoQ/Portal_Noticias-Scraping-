document.addEventListener('DOMContentLoaded', function() {
    // Agregar clases a los campos del formulario
    const inputs = document.querySelectorAll('input[type="text"], input[type="password"], input[type="email"]');
    inputs.forEach(input => {
        input.classList.add('form-control');
        
        // Agregar validación visual
        input.addEventListener('blur', function() {
            if (this.value.trim() === '') {
                this.classList.add('error');
            } else {
                this.classList.remove('error');
            }
        });
    });

    // Agregar placeholders si no los tienen
    const usernameField = document.querySelector('#id_username');
    const passwordField = document.querySelector('#id_password');
    
    if (usernameField && !usernameField.getAttribute('placeholder')) {
        usernameField.setAttribute('placeholder', 'Ingresa tu usuario');
    }
    
    if (passwordField && !passwordField.getAttribute('placeholder')) {
        passwordField.setAttribute('placeholder', 'Ingresa tu contraseña');
    }
});
