import io
from django.shortcuts import render
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import Noticia
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
from django.http import JsonResponse
from django.core.management import call_command

# Función helper para manejar lógica común de listas de noticias
def lista_noticias_helper(request, queryset_base, template_name):
    # Filtros comunes
    filtro_imagen = request.GET.get('con_imagen', False)
    filtro_fecha = request.GET.get('fecha', 'todas')
    busqueda = request.GET.get('q', '')
    
    noticias = queryset_base
    
    # Filtrar por búsqueda
    if busqueda:
        noticias = noticias.filter(
            Q(titulo__icontains=busqueda) | 
            Q(autor__icontains=busqueda)
        )
    
    # Filtrar por imagen
    if filtro_imagen:
        noticias = noticias.exclude(imagen__isnull=True).exclude(imagen='')
    
    # Filtrar por fecha
    if filtro_fecha == 'hoy':
        hoy = timezone.now().date()
        noticias = noticias.filter(fecha__date=hoy)
    elif filtro_fecha == 'semana':
        hace_una_semana = timezone.now() - timedelta(days=7)
        noticias = noticias.filter(fecha__gte=hace_una_semana)
    elif filtro_fecha == 'mes':
        hace_un_mes = timezone.now() - timedelta(days=30)
        noticias = noticias.filter(fecha__gte=hace_un_mes)
    
    # Ordenar
    noticias = noticias.order_by('-fecha', '-fecha_scraping')
    
    # Paginación
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
    
    # Estadísticas (basadas en el queryset filtrado)
    total_noticias = noticias.count()
    noticias_con_imagen = noticias.exclude(imagen__isnull=True).exclude(imagen='').count()
    
    # Contexto común (incluyo paginator siempre para consistencia)
    context = {
        'noticias': noticias_paginadas,
        'total_noticias': total_noticias,
        'noticias_con_imagen': noticias_con_imagen,
        'filtro_actual': {
            'imagen': filtro_imagen,
            'fecha': filtro_fecha,
            'busqueda': busqueda
        },
        'paginator': paginator  # Agregado para todas por consistencia
    }
    
    return render(request, template_name, context)

# Vistas para El Comercio (usando el helper)
def lista_noticias(request):
    queryset = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"))
    return lista_noticias_helper(request, queryset, 'noticias/lista.html')

def politica(request):
    queryset = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"), enlace__icontains="/politica/")
    return lista_noticias_helper(request, queryset, 'noticias/politica.html')

def economia(request):
    queryset = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"), enlace__icontains="/economia/")
    return lista_noticias_helper(request, queryset, 'noticias/economia.html')

def mundo(request):
    queryset = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"), enlace__icontains="/mundo/")
    return lista_noticias_helper(request, queryset, 'noticias/mundo.html')

def tecnologia(request):
    queryset = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"), enlace__icontains="/tecnologia/")
    return lista_noticias_helper(request, queryset, 'noticias/tecnologia.html')

# Vistas para Peru21 (usando el mismo helper)
def peru21(request):
    queryset = Noticia.objects.filter(origen='peru21')
    return lista_noticias_helper(request, queryset, 'peru21/peru21.html')

def peru21d(request):
    queryset = Noticia.objects.filter(origen='peru21', enlace__icontains="/deportes/")
    return lista_noticias_helper(request, queryset, 'peru21/peru21d.html')

def peru21g(request):
    queryset = Noticia.objects.filter(origen='peru21', enlace__icontains="/gastronomia/")
    return lista_noticias_helper(request, queryset, 'peru21/peru21g.html')

def peru21i(request):
    queryset = Noticia.objects.filter(origen='peru21', enlace__icontains="/investigacion/")
    return lista_noticias_helper(request, queryset, 'peru21/peru21i.html')

def peru21l(request):
    queryset = Noticia.objects.filter(origen='peru21', enlace__icontains="/lima/")
    return lista_noticias_helper(request, queryset, 'peru21/peru21l.html')

# Vista genérica para scraping
def ejecutar_scraping_generico(request, command_name):
    if request.method == "POST":
        buffer = io.StringIO()
        try:
            call_command(command_name, stdout=buffer)
            return JsonResponse({"status": "ok", "log": buffer.getvalue()})
        except Exception as e:
            return JsonResponse({"status": "error", "error": str(e)})
    return JsonResponse({"status": "error", "error": "Método no permitido"})

# Asignar vistas de scraping específicas (puedes usar la genérica directamente en urls.py con parámetros)
def ejecutar_scraping_lista_noticias(request):
    return ejecutar_scraping_generico(request, "scrape_elcomercio")

def ejecutar_scraping_politica(request):
    return ejecutar_scraping_generico(request, "scrape_elcomercio_pol")

def ejecutar_scraping_economia(request):
    return ejecutar_scraping_generico(request, "scrape_economia")

def ejecutar_scraping_mundo(request):
    return ejecutar_scraping_generico(request, "scrape_mundo")

def ejecutar_scraping_tecnologia(request):
    return ejecutar_scraping_generico(request, "scrape_tecnologia")

# Nota: Para Peru21, no vi vistas de scraping en tu código original, pero si las agregas, usa la misma genérica.