import io
import logging
from django.shortcuts import render
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta, datetime
from .models import Noticia, NoticiasVistas
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse
from django.core.management import call_command
from .tasks import scrape_all_sections, run_single_scrape
from celery.result import AsyncResult
from django.contrib.auth.decorators import login_required
from django.core.exceptions import PermissionDenied
from accounts.utils import registrar_busqueda, registrar_scraping, registrar_vista_noticia_actividad, registrar_compartir

# Función helper mejorada para manejar lógica común de listas de noticias
@login_required
def lista_noticias_helper(request, queryset_base, template_name, nav_type='comercio'):
    # Obtener filtros desde GET
    filtro_imagen = request.GET.get('con_imagen', '')
    filtro_fecha = request.GET.get('fecha', 'todas')
    fecha_desde = request.GET.get('fecha_desde', '')
    fecha_hasta = request.GET.get('fecha_hasta', '')
    busqueda = request.GET.get('q', '')
    
        # REGISTRAR BÚSQUEDA SI HAY TÉRMINO
    if busqueda and request.user.is_authenticated:
        registrar_busqueda(request.user, busqueda)
    
    noticias = queryset_base
    
    # ===== FILTRO POR BÚSQUEDA =====
    if busqueda:
        noticias = noticias.filter(
            Q(titulo__icontains=busqueda) | 
            Q(autor__icontains=busqueda)
        )
    
    # ===== FILTRO POR IMAGEN =====
    if filtro_imagen == '1':
        noticias = noticias.exclude(imagen__isnull=True).exclude(imagen='')
    
    # ===== FILTRO POR FECHA =====
    now = timezone.now()
    
    if filtro_fecha == 'hoy':
        # Noticias de hoy
        inicio_dia = now.replace(hour=0, minute=0, second=0, microsecond=0)
        noticias = noticias.filter(fecha__gte=inicio_dia)
        
    elif filtro_fecha == 'ayer':
        # Noticias de ayer
        ayer = now - timedelta(days=1)
        inicio_ayer = ayer.replace(hour=0, minute=0, second=0, microsecond=0)
        fin_ayer = ayer.replace(hour=23, minute=59, second=59, microsecond=999999)
        noticias = noticias.filter(fecha__gte=inicio_ayer, fecha__lte=fin_ayer)
        
    elif filtro_fecha == 'semana':
        # Últimos 7 días
        hace_una_semana = now - timedelta(days=7)
        noticias = noticias.filter(fecha__gte=hace_una_semana)
        
    elif filtro_fecha == 'mes':
        # Últimos 30 días
        hace_un_mes = now - timedelta(days=30)
        noticias = noticias.filter(fecha__gte=hace_un_mes)
        
    elif filtro_fecha == 'rango' and fecha_desde and fecha_hasta:
        # Rango personalizado
        try:
            fecha_inicio = datetime.strptime(fecha_desde, '%Y-%m-%d')
            fecha_fin = datetime.strptime(fecha_hasta, '%Y-%m-%d')
            
            # Hacer timezone aware
            fecha_inicio = timezone.make_aware(fecha_inicio.replace(hour=0, minute=0, second=0))
            fecha_fin = timezone.make_aware(fecha_fin.replace(hour=23, minute=59, second=59))
            
            noticias = noticias.filter(fecha__gte=fecha_inicio, fecha__lte=fecha_fin)
        except ValueError:
            # Si hay error en las fechas, ignorar el filtro
            pass
    
    # ===== ORDENAMIENTO =====
    noticias = noticias.order_by('-fecha', '-fecha_scraping')
    
    # ===== PAGINACIÓN =====
    page = request.GET.get('page', 1)
    per_page = request.GET.get('per_page', 10)
    
    try:
        per_page = int(per_page)
        if per_page not in [10, 20, 50]:
            per_page = 10
    except (ValueError, TypeError):
        per_page = 10
    
    paginator = Paginator(noticias, per_page)
    
    try:
        noticias_paginadas = paginator.page(page)
    except PageNotAnInteger:
        noticias_paginadas = paginator.page(1)
    except EmptyPage:
        noticias_paginadas = paginator.page(paginator.num_pages)
    
    # ===== ESTADÍSTICAS =====
    total_noticias = noticias.count()
    noticias_con_imagen = noticias.exclude(imagen__isnull=True).exclude(imagen='').count()
    
    # ===== CONTEXTO =====
    context = {
        'noticias': noticias_paginadas,
        'total_noticias': total_noticias,
        'noticias_con_imagen': noticias_con_imagen,
        'nav_type': nav_type,
        'filtro_actual': {
            'imagen': filtro_imagen == '1',
            'fecha': filtro_fecha,
            'busqueda': busqueda,
            'fecha_desde': fecha_desde,
            'fecha_hasta': fecha_hasta,
        },
        'today': timezone.now().date(),
        'paginator': paginator
    }
    
    return render(request, template_name, context)

# ===== VISTAS PARA EL COMERCIO =====
@login_required
def lista_noticias(request):
    queryset = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"))
    return lista_noticias_helper(request, queryset, 'noticias/lista.html', nav_type='comercio')

@login_required
def politica(request):
    queryset = Noticia.objects.filter(
        Q(origen="elcomercio") | Q(origen="desconocido"), 
        enlace__icontains="/politica/"
    )
    return lista_noticias_helper(request, queryset, 'noticias/politica.html', nav_type='comercio')

@login_required
def economia(request):
    queryset = Noticia.objects.filter(
        Q(origen="elcomercio") | Q(origen="desconocido"), 
        enlace__icontains="/economia/"
    )
    return lista_noticias_helper(request, queryset, 'noticias/economia.html', nav_type='comercio')

@login_required
def mundo(request):
    queryset = Noticia.objects.filter(
        Q(origen="elcomercio") | Q(origen="desconocido"), 
        enlace__icontains="/mundo/"
    )
    return lista_noticias_helper(request, queryset, 'noticias/mundo.html', nav_type='comercio')

@login_required
def tecnologia(request):
    queryset = Noticia.objects.filter(
        Q(origen="elcomercio") | Q(origen="desconocido"), 
        enlace__icontains="/tecnologia/"
    )
    return lista_noticias_helper(request, queryset, 'noticias/tecnologia.html', nav_type='comercio')

# ===== VISTAS PARA PERU21 =====
@login_required
def peru21(request):
    queryset = Noticia.objects.filter(origen='peru21')
    return lista_noticias_helper(request, queryset, 'peru21/peru21.html', nav_type='peru21')

@login_required
def peru21d(request):
    queryset = Noticia.objects.filter(origen='peru21', enlace__icontains="/deportes/")
    return lista_noticias_helper(request, queryset, 'peru21/peru21d.html', nav_type='peru21')

@login_required
def peru21g(request):
    queryset = Noticia.objects.filter(origen='peru21', enlace__icontains="/gastronomia/")
    return lista_noticias_helper(request, queryset, 'peru21/peru21g.html', nav_type='peru21')

@login_required
def peru21i(request):
    queryset = Noticia.objects.filter(origen='peru21', enlace__icontains="/investigacion/")
    return lista_noticias_helper(request, queryset, 'peru21/peru21i.html', nav_type='peru21')

@login_required
def peru21l(request):
    queryset = Noticia.objects.filter(origen='peru21', enlace__icontains="/lima/")
    return lista_noticias_helper(request, queryset, 'peru21/peru21l.html', nav_type='peru21')

# ===== VISTAS DE SCRAPING =====
def ejecutar_scraping_generico(request, command_name=None):
    """Ejecuta scraping de manera asíncrona usando Celery"""
    if request.method == "POST":
        try:
            # Verificar permisos antes de procesar
            if request.user.profile.role not in ['premium', 'admin']:
                return JsonResponse({
                    "status": "error",
                    "message": "Solo usuarios Premium pueden ejecutar scraping",
                    "error_type": "permission_denied"
                }, status=403)
                
            # Si se pasa un comando específico
            if command_name:
                if command_name:
                    task = run_single_scrape.delay(command_name)
                    message = f"Tarea '{command_name}' enviada a Celery"
            else:
                # Ejecuta todas las secciones a la vez (la tarea ya existe)
                task = scrape_all_sections.delay()
                message = "Tarea global de scraping enviada a Celery"

            return JsonResponse({
                "status": "ok",
                "task_id": task.id,
                "message": message
            })

        except Exception as e:
            return JsonResponse({
                "status": "error",
                "error": str(e),
                "message": f"Error al enviar la tarea Celery: {str(e)}"
            }, status=500)

    return JsonResponse({
        "status": "error",
        "error": "Método no permitido",
        "message": "Solo se permiten peticiones POST"
    }, status=405)

# ===== VISTAS DE SCRAPING ESPECÍFICAS =====
@login_required
def ejecutar_scraping_lista_noticias(request):   
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "elcomercio - Noticias principales")
    
    return ejecutar_scraping_generico(request, "scrape_elcomercio")

@login_required
def ejecutar_scraping_politica(request):
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "elcomecio - Politica")
    
    return ejecutar_scraping_generico(request, "scrape_elcomercio_pol")

@login_required
def ejecutar_scraping_economia(request):    
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "elcomecio - Economia")
    
    return ejecutar_scraping_generico(request, "scrape_economia")

@login_required
def ejecutar_scraping_mundo(request):
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "elcomecio - Mundo")
    
    return ejecutar_scraping_generico(request, "scrape_mundo")

@login_required
def ejecutar_scraping_tecnologia(request):
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "elcomecio - Tecnologia")
    
    return ejecutar_scraping_generico(request, "scrape_tecnologia")

@login_required
def ejecutar_scraping_peru21(request):
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "Perú21 - Noticias principales")
    
    return ejecutar_scraping_generico(request, "scrape_peru21")

@login_required
def ejecutar_scraping_peru21_deportes(request):
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "Perú21 - Deportes")
    
    return ejecutar_scraping_generico(request, "scrape_peru21D")

@login_required
def ejecutar_scraping_peru21_gastronomia(request):
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "Perú21 - Gastronomía")
    
    return ejecutar_scraping_generico(request, "scrape_peru21G")

@login_required
def ejecutar_scraping_peru21_investigacion(request):
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "Perú21 - Investigación")
    
    return ejecutar_scraping_generico(request, "scrape_peru21I")

@login_required
def ejecutar_scraping_peru21_lima(request):
    # REGISTRAR ACTIVIDAD DE SCRAPING
    registrar_scraping(request.user, "Perú21 - Lima")
    
    return ejecutar_scraping_generico(request, "scrape_peru21L")

# ===== VISTA API PARA ESTADÍSTICAS (OPCIONAL) =====
@login_required
def estadisticas_noticias(request):
    """Vista opcional para obtener estadísticas de noticias vía API"""
    origen = request.GET.get('origen', 'all')
    
    if origen == 'all':
        queryset = Noticia.objects.all()
    else:
        queryset = Noticia.objects.filter(origen=origen)
    
    total = queryset.count()
    con_imagen = queryset.exclude(imagen__isnull=True).exclude(imagen='').count()
    
    # Estadísticas por período
    now = timezone.now()
    hoy = queryset.filter(fecha__date=now.date()).count()
    semana = queryset.filter(fecha__gte=now - timedelta(days=7)).count()
    mes = queryset.filter(fecha__gte=now - timedelta(days=30)).count()
    
    return JsonResponse({
        'total': total,
        'con_imagen': con_imagen,
        'sin_imagen': total - con_imagen,
        'hoy': hoy,
        'ultima_semana': semana,
        'ultimo_mes': mes,
        'origen': origen
    })

logger = logging.getLogger(__name__)
@login_required
def ver_estado_tarea(request, task_id):
    """Ver el estado de una tarea Celery con manejo robusto de errores."""
    try:
        task_result = AsyncResult(task_id)
        
        response_data = {
            'task_id': task_id,
            'status': task_result.status,
            'state': task_result.state,
            'ready': task_result.ready(),
        }
        
        if task_result.ready():
            if task_result.successful():
                response_data['result'] = task_result.result
                response_data['completed'] = True
                response_data['success'] = True
            else:
                response_data['result'] = str(task_result.result)
                response_data['completed'] = True
                response_data['failed'] = True
                response_data['error'] = str(task_result.result)
        else:
            # Tarea aún en progreso - MANEJO ROBUSTO DE ERRORES
            response_data['completed'] = False
            
            # 🔥 MEJORA: Intentar obtener metadatos de múltiples formas
            progress_data = None
            
            # Método 1: Usar task_result.info (el método estándar)
            try:
                if hasattr(task_result, 'info') and task_result.info:
                    if isinstance(task_result.info, dict):
                        progress_data = task_result.info
                    else:
                        # Si info no es dict, crear estructura estándar
                        progress_data = {
                            'current': 50,
                            'total': 100,
                            'status': f'Tarea en progreso: {task_result.status}'
                        }
            except Exception as e:
                logger.warning(f"Error obteniendo info de tarea: {e}")
            
            # Método 2: Si el método 1 falló, intentar leer directamente del backend
            if progress_data is None:
                try:
                    # Verificar si el backend tiene el método get
                    if hasattr(task_result, 'backend') and hasattr(task_result.backend, 'get'):
                        backend_data = task_result.backend.get(task_result.id)
                        
                        # El backend puede devolver diferentes estructuras
                        if isinstance(backend_data, tuple) and len(backend_data) >= 3:
                            # Estructura (status, traceback, result)
                            _, _, meta = backend_data
                            if isinstance(meta, dict):
                                progress_data = meta
                        elif isinstance(backend_data, dict):
                            # Estructura directa con metadatos
                            progress_data = backend_data
                except Exception as e:
                    logger.warning(f"Error leyendo del backend de Celery: {e}")
            
            # Método 3: Si todo falla, usar progreso basado en estado
            if progress_data is None:
                progress_map = {
                    'PENDING': 5,
                    'STARTED': 15, 
                    'PROGRESS': 50
                }
                default_progress = progress_map.get(task_result.status, 25)
                
                progress_data = {
                    'current': default_progress,
                    'total': 100,
                    'status': f'Tarea en estado: {task_result.status}',
                    'command': 'scraping',
                    'articles_processed': 0,
                    'total_articles_found': 0
                }
            
            # Asegurarnos de que progress_data sea un diccionario válido
            if not isinstance(progress_data, dict):
                logger.warning(f"progress_data no es un diccionario: {progress_data}")
                progress_data = {
                    'current': 25,
                    'total': 100,
                    'status': 'Procesando...',
                    'command': 'scraping',
                    'articles_processed': 0,
                    'total_articles_found': 0
                }
            
            response_data['progress'] = progress_data
        
        return JsonResponse(response_data)
        
    except Exception as e:
        logger.error(f"Error en ver_estado_tarea: {e}")
        return JsonResponse({
            'status': 'ERROR',
            'error': str(e),
            'completed': False
        }, status=500)

@login_required
def registrar_vista_noticia(request, noticia_id):
    """Registra cuando un usuario ve una noticia"""
    try:
        noticia = Noticia.objects.get(id=noticia_id)
        
        # Crear o obtener el registro de noticia vista
        NoticiasVistas.objects.get_or_create(
            usuario=request.user,
            noticia=noticia
        )
        
        # REGISTRAR ACTIVIDAD DE VISTA
        registrar_vista_noticia_actividad(request.user, noticia)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Vista registrada correctamente'
        })
        
    except Noticia.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Noticia no encontrada'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)

@login_required
def registrar_compartir_noticia(request, noticia_id):
    """Registra cuando un usuario comparte una noticia"""
    try:
        noticia = Noticia.objects.get(id=noticia_id)
        plataforma = request.POST.get('plataforma', 'general')
        
        # REGISTRAR ACTIVIDAD DE COMPARTIR
        registrar_compartir(request.user, noticia, plataforma)
        
        return JsonResponse({
            'status': 'success',
            'message': 'Compartir registrado correctamente',
            'plataforma': plataforma
        })
        
    except Noticia.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'Noticia no encontrada'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)