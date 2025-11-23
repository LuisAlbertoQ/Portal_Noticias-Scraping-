# analisis/views.py
import logging
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from django.utils import timezone
from datetime import timedelta
from scraping.models import Noticia
from .models import AnalisisNoticia
from .tasks import analizar_noticia_task
from celery.result import AsyncResult
from django.core.paginator import Paginator

logger = logging.getLogger(__name__)

def check_user_premium(user):
    """
    Función helper segura para verificar permisos
    """
    if user.is_staff or user.is_superuser:
        return True
    try:
        # Si usas django-guardian o similar, ajusta aquí
        return hasattr(user, 'profile') and user.profile.role in ['premium', 'admin']
    except Exception as e:
        logger.error(f"Error checking user permissions: {e}")
        return user.is_staff  # Fallback: solo staff puede analizar

@login_required
def lista_noticias_analisis(request):
    filtro = request.GET.get('filtro', 'todas')
    
    # Obtener IDs como lista de enteros
    noticias_analizadas_ids = list(AnalisisNoticia.objects.filter(
        usuario=request.user,
        estado='completado'
    ).values_list('noticia_id', flat=True))
    
    # Filtrar noticias
    if filtro == 'con_analisis':
        noticias = Noticia.objects.filter(id__in=noticias_analizadas_ids)
    elif filtro == 'sin_analisis':
        noticias = Noticia.objects.exclude(id__in=noticias_analizadas_ids)
    else:
        noticias = Noticia.objects.all()
    
    # DICCIONARIO CLAVE: noticia_id -> analisis
    analisis_usuario = {
        analisis.noticia_id: analisis 
        for analisis in AnalisisNoticia.objects.filter(usuario=request.user).select_related('noticia')
    }
    
    context = {
        'noticias': noticias,
        'filtro_actual': filtro,
        'noticias_analizadas_ids': noticias_analizadas_ids,
        'analisis_usuario': analisis_usuario,
    }
    return render(request, 'analisis/lista.html', context)

@login_required
def ver_resultado_analisis(request, analisis_id):
    """Muestra el resultado completo de un análisis"""
    analisis = get_object_or_404(
        AnalisisNoticia.objects.select_related('noticia'),
        id=analisis_id
    )
    
    # Verificar permiso (solo el dueño o admin)
    if analisis.usuario != request.user:
        raise PermissionDenied("No tienes permiso para ver este análisis")
    
    # Contexto simplificado (solo datos del análisis)
    context = {
        'analisis': analisis,
        'noticia': analisis.noticia,
    }
    
    # Usar plantilla SIN base.html
    return render(request, 'analisis/resultado_simple.html', context)

# ===== API ENDPOINTS =====

@login_required
def api_iniciar_analisis(request, noticia_id):
    """Inicia el análisis de una noticia (llamada desde el botón)"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)
    
    if not check_user_premium(request.user):
        return JsonResponse({
            'status': 'error',
            'message': 'Solo usuarios Premium pueden analizar noticias',
            'error_type': 'permission_denied'
        }, status=403)
    
    try:
        noticia = Noticia.objects.get(id=noticia_id)
        
        # 🔥 VERIFICAR SI EL USUARIO ACTUAL YA TIENE UN ANÁLISIS
        analisis_existente = AnalisisNoticia.objects.filter(
            noticia=noticia,
            usuario=request.user,
            estado='completado'
        ).first()
        
        if analisis_existente:
            return JsonResponse({
                'status': 'existe',
                'analisis_id': analisis_existente.id,
                'message': 'Ya tienes un análisis de esta noticia',
                'task_id': None
            })
        
        # CREAR NUEVO ANÁLISIS PARA EL USUARIO ACTUAL
        analisis_pendiente, created = AnalisisNoticia.objects.get_or_create(
            noticia=noticia,
            usuario=request.user,  # 🔥 ASOCIAR AL USUARIO ACTUAL
            defaults={'estado': 'pendiente'}
        )
        
        analisis_pendiente.estado = 'en_proceso'
        analisis_pendiente.save()
        
        # LANZAR TAREA CELERY
        task = analizar_noticia_task.delay(noticia_id, request.user.id)
        
        analisis_pendiente.task_id = task.id
        analisis_pendiente.save()
        
        return JsonResponse({
            'status': 'ok',
            'task_id': task.id,
            'analisis_id': analisis_pendiente.id,
            'message': 'Análisis iniciado correctamente'
        })
        
    except Exception as e:
        logger.error(f"Error en api_iniciar_analisis: {str(e)}", exc_info=True)
        return JsonResponse({
            'status': 'error',
            'message': f'Server Error: {str(e)}',
            'error_type': 'server_error'
        }, status=500)

@login_required
def api_estado_analisis(request, task_id):
    """Consulta el estado de una tarea de análisis"""
    try:
        task_result = AsyncResult(task_id)
        
        response_data = {
            'task_id': task_id,
            'status': task_result.status,
            'ready': task_result.ready(),
        }
        
        if task_result.ready():
            if task_result.successful():
                result = task_result.result
                response_data['completed'] = True
                response_data['success'] = True
                response_data['analisis_id'] = result.get('analisis_id') if isinstance(result, dict) else None
            else:
                response_data['completed'] = True
                response_data['failed'] = True
                response_data['error'] = str(task_result.result)
        else:
            # Progreso
            progress_data = {
                'current': 25,
                'total': 100,
                'status': 'Procesando...'
            }
            
            if hasattr(task_result, 'info') and isinstance(task_result.info, dict):
                progress_data.update(task_result.info)
            
            response_data['progress'] = progress_data
        
        return JsonResponse(response_data)
        
    except Exception as e:
        logger.error(f"Error en api_estado_analisis: {e}")
        return JsonResponse({
            'status': 'ERROR',
            'error': str(e)
        }, status=500)

@login_required
def api_ultimo_analisis(request, noticia_id):
    """Devuelve el análisis más reciente de una noticia DEL USUARIO ACTUAL"""
    try:
        analisis = AnalisisNoticia.objects.filter(
            noticia_id=noticia_id,
            usuario=request.user,  # 🔥 SOLO DEL USUARIO ACTUAL
            estado='completado'
        ).latest('creado_en')
        
        return JsonResponse({
            'status': 'existe',
            'analisis_id': analisis.id,
            'resumen': analisis.resumen[:200] + '...' if analisis.resumen else '',
            'sentimiento': analisis.sentimiento,
            'categoria': analisis.categoria,
            'entidades_count': analisis.get_entidades_count(),
            'palabras_clave': analisis.palabras_clave[:5] if analisis.palabras_clave else [],
            'creado_en': analisis.creado_en.isoformat()
        })
        
    except AnalisisNoticia.DoesNotExist:
        return JsonResponse({'status': 'no_existe'})
    except Exception as e:
        return JsonResponse({'status': 'no_existe'})
    
@login_required
def mis_analisis(request):
    """Vista para mostrar todos los análisis del usuario en su perfil"""
    
    # Obtener todos los análisis del usuario
    analisis_list = AnalisisNoticia.objects.filter(
        usuario=request.user
    ).select_related('noticia').order_by('-creado_en')
    
    # Calcular los conteos por estado
    completado_count = analisis_list.filter(estado='completado').count()
    proceso_count = analisis_list.filter(estado='en_proceso').count()
    error_count = analisis_list.filter(estado='error').count()
    
    # Paginar los resultados (9 por página para un grid de 3x3)
    paginator = Paginator(analisis_list, 9)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'analisis_list': page_obj,
        'total_analisis': analisis_list.count(),
        'completado_count': completado_count,
        'proceso_count': proceso_count,
        'error_count': error_count,
    }
    
    return render(request, 'analisis/mis_analisis.html', context)