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
    const fields = [
        { id: 'id_username', placeholder: 'Elige un nombre de usuario' },
        { id: 'id_email', placeholder: 'tu@email.com' },
        { id: 'id_password1', placeholder: 'Crea una contraseña segura' },
        { id: 'id_password2', placeholder: 'Repite tu contraseña' }
    ];

    fields.forEach(field => {
        const element = document.querySelector('#' + field.id);
        if (element && !element.getAttribute('placeholder')) {
            element.setAttribute('placeholder', field.placeholder);
        }
    });

    // Validación de contraseñas en tiempo real
    const password1 = document.querySelector('#id_password1');
    const password2 = document.querySelector('#id_password2');

    function validatePasswords() {
        if (password1 && password2 && password1.value && password2.value) {
            if (password1.value !== password2.value) {
                password2.classList.add('error');
            } else {
                password2.classList.remove('error');
            }
        }
    }

    if (password1 && password2) {
        password1.addEventListener('input', validatePasswords);
        password2.addEventListener('input', validatePasswords);
    }
});
