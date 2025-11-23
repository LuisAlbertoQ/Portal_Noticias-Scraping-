# analisis/tasks.py
from celery import shared_task
from django.conf import settings
from scraping.models import Noticia
from .models import AnalisisNoticia
import openai
import requests
from bs4 import BeautifulSoup
import json
import logging

logger = logging.getLogger(__name__)

# Inicializar cliente OpenRouter
def get_openrouter_client():
    """
    Retorna cliente OpenAI configurado para OpenRouter
    """
    return openai.OpenAI(
        api_key=settings.OPENROUTER_API_KEY,
        base_url=settings.OPENROUTER_BASE_URL
    )

@shared_task(bind=True, max_retries=3)
def analizar_noticia_task(self, noticia_id, user_id=None):
    """
    Tarea Celery para analizar una noticia con OpenRouter
    """
    try:
        # Obtener noticia
        noticia = Noticia.objects.get(id=noticia_id)
        
        analisis = AnalisisNoticia.objects.get(
            noticia=noticia,
            usuario_id=user_id
        )
        
        if not analisis:
            logger.error(f"No se encontró análisis para noticia {noticia_id} y usuario {user_id}")
            raise Exception("Análisis no encontrado")
        
        # Actualizar estado
        analisis.estado = 'en_proceso'
        analisis.save()
        
        self.update_state(
            state='PROGRESS',
            meta={
                'current': 20,
                'total': 100,
                'status': 'Obteniendo contenido de la noticia...'
            }
        )
        
        # Resto del código igual...
        contenido = scrape_contenido_noticia(noticia.enlace)
        
        if not contenido:
            raise Exception("No se pudo obtener el contenido de la noticia")
        
        self.update_state(
            state='PROGRESS',
            meta={
                'current': 40,
                'total': 100,
                'status': 'Enviando a OpenRouter...'
            }
        )
        
        # Llamar a OpenRouter
        resultado_ia = llamar_openrouter_analisis(
            titulo=noticia.titulo,
            contenido=contenido,
            autor=noticia.autor
        )
        
        self.update_state(
            state='PROGRESS',
            meta={
                'current': 80,
                'total': 100,
                'status': 'Guardando resultados...'
            }
        )
        
        # Guardar resultados
        analisis.resumen = resultado_ia['resumen']
        analisis.sentimiento = resultado_ia['sentimiento']['label']
        analisis.sentimiento_confianza = resultado_ia['sentimiento']['confianza']
        analisis.categoria = resultado_ia['categoria']
        analisis.entidades = resultado_ia['entidades']
        analisis.palabras_clave = resultado_ia['palabras_clave']
        analisis.tokens_usados = resultado_ia.get('tokens_usados', 0)
        analisis.coste_estimado = resultado_ia.get('coste', 0.0)
        analisis.estado = 'completado'
        analisis.save()
        
        return {
            'status': 'completado',
            'analisis_id': analisis.id,
            'message': 'Análisis completado exitosamente'
        }
        
    except Exception as e:
        logger.error(f"Error en análisis de noticia {noticia_id}: {str(e)}")
        
        # Actualizar estado de error
        try:
            analisis.estado = 'error'
            analisis.save()
        except:
            pass
        
        # Reintentar si es un error de API
        if any(word in str(e).lower() for word in ['rate_limit', 'timeout', '429']):
            raise self.retry(exc=e, countdown=60)
        
        raise e

def scrape_contenido_noticia(url):
    """
    Scrapea el contenido real de la noticia desde la URL
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # 🔥 CORREGIR SELECTORES POR ORDEN DE PRECEDENCIA
        
        # El Comercio
        if "elcomercio" in url:
            content_div = (
                soup.find('div', class_='story-contents__content') or 
                soup.find('article')
            )
        
        # Perú21 - Múltiples intentos en ORDEN
        elif "peru21" in url:
            content_div = (
                soup.find('div', class_='note__text') or  # ← PRIMERO ESTE (más común)
                soup.find('div', class_='note-content') or  # ← Segundo
                soup.find('article') or  # ← Tercero
                soup.find('div', class_='clearfix')  # ← Último fallback
            )
        else:
            # Fallback genérico
            content_div = soup.find('article') or soup.find('main')
        
        # Si no encontramos content_div, intento de emergencia: buscar todos los <p>
        if not content_div:
            logger.warning(f"No se encontró content_div en {url}, usando fallback de párrafos")
            parrafos = soup.find_all('p')
            texto = ' '.join([p.get_text(strip=True) for p in parrafos[:20]])
            return texto[:4000] if texto else None
        
        # Extraer texto de párrafos
        parrafos = content_div.find_all('p')
        texto = ' '.join([p.get_text(strip=True) for p in parrafos[:15]])
        
        return texto[:4000]
        
    except Exception as e:
        logger.error(f"Error scrapeando {url}: {e}")
        return None

def llamar_openrouter_analisis(titulo, contenido, autor):
    """
    Llama a OpenRouter para analizar la noticia
    """
    try:
        # Limitar contenido para no exceder tokens
        contenido_corto = contenido[:2500] if len(contenido) > 2500 else contenido
        
        prompt = f"""
        Analiza la siguiente noticia y devuelve UN SOLO OBJETO JSON con esta estructura exacta:

        NOTICIA:
        Título: {titulo}
        Autor: {autor}
        Contenido: {contenido_corto}

        FORMATO JSON DE SALIDA:
        {{
          "resumen": "Resumen ejecutivo de 2-3 párrafos clave",
          "sentimiento": {{ "label": "positivo/neutro/negativo", "confianza": 0.95 }},
          "categoria": "Política/Economía/Tecnología/Deportes/Gastronomía/Investigación/Mundo/Lima",
          "entidades": {{
            "PERSON": ["Nombre1", "Nombre2"],
            "ORG": ["Organización1", "Organización2"],
            "LOC": ["Lugar1", "Lugar2"]
          }},
          "palabras_clave": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
        }}

        REGLAS IMPORTANTES:
        1. Categoría DEBE ser UNA de las listadas exactamente
        2. Confianza es un float entre 0 y 1 (ej: 0.85)
        3. Máximo 3 entidades por tipo
        4. Exactamente 5 palabras clave, ordenadas por relevancia
        5. Resumen en español, objetivo y profesional
        6. Devuelve SOLO el JSON, sin explicaciones adicionales
        """
        
        # Inicializar cliente
        client = get_openrouter_client()
        
        response = client.chat.completions.create(
            model=settings.OPENROUTER_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "Eres un analista de noticias profesional. Devuelve ÚNICAMENTE JSON válido, sin texto adicional."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=800  # Suficiente para el JSON completo
        )
        
        # Parsear respuesta
        content = response.choices[0].message.content
        
        # Limpiar posible markdown (algunos modelos devuelven ```json ... ```)
        if content.startswith('```'):
            content = content.split('```')[1]
            if content.startswith('json'):
                content = content[4:]
            content = content.strip()
        
        try:
            resultado = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"OpenRouter no devolvió JSON válido. Contenido: {content[:200]}")
            logger.error(f"Error de parsing: {e}")
            raise Exception("La IA no devolvió un formato JSON válido")
        
        # Calcular coste aproximado (OpenRouter devuelve coste en sus headers)
        tokens_usados = response.usage.total_tokens
        # Coste promedio estimado para gpt-3.5-turbo via OpenRouter
        coste = (tokens_usados / 1000) * 0.0015  # Aprox $0.0015 por 1K tokens
        
        resultado['tokens_usados'] = tokens_usados
        resultado['coste'] = round(coste, 4)
        
        return resultado
        
    except json.JSONDecodeError as e:
        logger.error(f"OpenRouter no devolvió JSON válido: {e}")
        raise Exception("La IA no devolvió un formato válido")
    except Exception as e:
        logger.error(f"Error llamando a OpenRouter: {e}")
        raise e