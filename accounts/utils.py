from .models import Actividad
from django.utils import timezone

def registrar_actividad(usuario, tipo, descripcion, noticia=None, datos_extra=None):
    """Función helper para registrar actividades"""
    actividad = Actividad(
        usuario=usuario,
        tipo=tipo,
        descripcion=descripcion,
        noticia=noticia,
        datos_extra=datos_extra or {}
    )
    actividad.save()
    return actividad

def registrar_vista_noticia_actividad(usuario, noticia):
    """Registra cuando un usuario ve una noticia"""
    return registrar_actividad(
        usuario=usuario,
        tipo='vista',
        descripcion=f'Vio noticia: {noticia.titulo[:50]}...',
        noticia=noticia
    )

def registrar_busqueda(usuario, termino):
    """Registra cuando un usuario realiza una búsqueda"""
    return registrar_actividad(
        usuario=usuario,
        tipo='busqueda',
        descripcion=f'Buscó: "{termino}"',
        datos_extra={'termino': termino}
    )

def registrar_compartir(usuario, noticia, plataforma=None):
    """Registra cuando un usuario comparte una noticia"""
    descripcion = f'Compartió noticia: {noticia.titulo[:50]}...'
    if plataforma:
        descripcion += f' en {plataforma}'
    
    return registrar_actividad(
        usuario=usuario,
        tipo='compartir',
        descripcion=descripcion,
        noticia=noticia,
        datos_extra={'plataforma': plataforma}
    )

def registrar_login(usuario):
    """Registra cuando un usuario inicia sesión"""
    return registrar_actividad(
        usuario=usuario,
        tipo='login',
        descripcion='Inició sesión en la plataforma'
    )

def registrar_scraping(usuario, seccion):
    """Registra cuando un usuario ejecuta scraping"""
    return registrar_actividad(
        usuario=usuario,
        tipo='scraping',
        descripcion=f'Ejecutó scraping en: {seccion}',
        datos_extra={'seccion': seccion}
    )