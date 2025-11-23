from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    """Obtiene un valor de un diccionario por clave"""
    return dictionary.get(key)

@register.filter
def debug_type(value):
    """Devuelve el tipo de dato para debug"""
    return type(value).__name__