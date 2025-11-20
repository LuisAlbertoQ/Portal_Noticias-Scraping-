// components/view-tracking.js
// Módulo para registrar vistas de noticias y actualizar el contador en UI

// Obtiene el token CSRF desde la cookie (patrón estándar de Django)
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

function getCsrfToken() {
  // Primero intenta via meta tag si existiera
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta && meta.content) return meta.content;
  // Fallback a cookie csrftoken
  return getCookie('csrftoken');
}

export async function registrarVista(noticiaId) {
  try {
    const resp = await fetch(`/noticias/registrar-vista/${noticiaId}/`, {
      method: 'POST',
      headers: {
        'X-CSRFToken': getCsrfToken() || '',
        'Content-Type': 'application/json',
      },
    });
    const data = await resp.json();
    if (data && data.status === 'success') {
      // Opcional: actualizar contador tras registrar vista
      actualizarContadorVistas();
      if (window && window.console) console.log('Vista registrada');
    }
    return data;
  } catch (error) {
    if (window && window.console) console.error('Error al registrar vista:', error);
    throw error;
  }
}

export async function actualizarContadorVistas() {
  try {
    const resp = await fetch('/accounts/obtener-contador-vistas/');
    const data = await resp.json();
    const contadorElement = document.querySelector('.stat-number');
    if (contadorElement && typeof data.count !== 'undefined') {
      contadorElement.textContent = Number(data.count).toLocaleString();
    }
    return data;
  } catch (error) {
    // Silencioso: no es crítico para la UX
    if (window && window.console) console.warn('No se pudo actualizar el contador de vistas:', error);
  }
}

// Inicializador opcional: delega clicks para elementos con data-registrar-vista
export function initViewTracking() {
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-registrar-vista]');
    if (!target) return;
    const noticiaId = target.getAttribute('data-registrar-vista');
    if (noticiaId) registrarVista(noticiaId);
  });
}
