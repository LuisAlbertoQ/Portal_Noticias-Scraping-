import io
from django.shortcuts import render
from django.db.models import Q
from django.utils import timezone
from datetime import timedelta
from .models import Noticia
from django.http import JsonResponse
from django.core.management import call_command

#Lista todas las noticias con filtros y estadísticas
def lista_noticias(request):
    # Filtros
    filtro_imagen = request.GET.get('con_imagen', False)
    filtro_fecha = request.GET.get('fecha', 'todas')
    busqueda = request.GET.get('q', '')
    
    # Query base
    noticias = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"))
    
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
    
    # Ordenar por fecha
    noticias = noticias.order_by('-fecha', '-fecha_scraping')
    
    # Estadísticas
    total_noticias = noticias.count()
    noticias_con_imagen = noticias.exclude(imagen__isnull=True).exclude(imagen='').count()
    
    context = {
        'noticias': noticias,
        'total_noticias': total_noticias,
        'noticias_con_imagen': noticias_con_imagen,
        'filtro_actual': {
            'imagen': filtro_imagen,
            'fecha': filtro_fecha,
            'busqueda': busqueda
        }
    }
    
    return render(request, 'noticias/lista.html', context)

def ejecutar_scraping_lista_noticias(request):
    """
    Llama al comando de scraping de Lista Noticias
    y devuelve el resultado en JSON.
    """
    if request.method == "POST":  # Seguridad: solo POST
        buffer = io.StringIO()
        try:
            call_command("scrape_elcomercio", stdout=buffer)
            return JsonResponse({"status": "ok", "log": buffer.getvalue()})
        except Exception as e:
            return JsonResponse({"status": "error", "error": str(e)})
    return JsonResponse({"status": "error", "error": "Método no permitido"})

#Lista noticias por categoria Politica
def politica(request):
    filtro_imagen = request.GET.get('con_imagen', False)
    filtro_fecha = request.GET.get('fecha', 'todas')
    busqueda = request.GET.get('q', '')

    # 🔹 Solo noticias de política
    noticias = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"), enlace__icontains="/politica/")

    if busqueda:
        noticias = noticias.filter(
            Q(titulo__icontains=busqueda) |
            Q(autor__icontains=busqueda)
        )

    if filtro_imagen:
        noticias = noticias.exclude(imagen__isnull=True).exclude(imagen='')

    if filtro_fecha == 'hoy':
        hoy = timezone.now().date()
        noticias = noticias.filter(fecha__date=hoy)
    elif filtro_fecha == 'semana':
        hace_una_semana = timezone.now() - timedelta(days=7)
        noticias = noticias.filter(fecha__gte=hace_una_semana)
    elif filtro_fecha == 'mes':
        hace_un_mes = timezone.now() - timedelta(days=30)
        noticias = noticias.filter(fecha__gte=hace_un_mes)

    noticias = noticias.order_by('-fecha', '-fecha_scraping')

    total_noticias = noticias.count()
    noticias_con_imagen = noticias.exclude(imagen__isnull=True).exclude(imagen='').count()

    context = {
        'noticias': noticias,
        'total_noticias': total_noticias,
        'noticias_con_imagen': noticias_con_imagen,
        'filtro_actual': {
            'imagen': filtro_imagen,
            'fecha': filtro_fecha,
            'busqueda': busqueda
        }
    }

    return render(request, 'noticias/politica.html', context)

def ejecutar_scraping_politica(request):
    """
    Llama al comando de scraping de Politica
    y devuelve el resultado en JSON.
    """
    if request.method == "POST":  # Seguridad: solo POST
        buffer = io.StringIO()
        try:
            call_command("scrape_elcomercio_pol", stdout=buffer)
            return JsonResponse({"status": "ok", "log": buffer.getvalue()})
        except Exception as e:
            return JsonResponse({"status": "error", "error": str(e)})
    return JsonResponse({"status": "error", "error": "Método no permitido"})

#Lista noticias por categoria Economia
def economia(request):
    filtro_imagen = request.GET.get('con_imagen', False)
    filtro_fecha = request.GET.get('fecha', 'todas')
    busqueda = request.GET.get('q', '')

    # 🔹 Solo noticias de economia
    noticias = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"), enlace__icontains="/economia/")

    if busqueda:
        noticias = noticias.filter(
            Q(titulo__icontains=busqueda) |
            Q(autor__icontains=busqueda)
        )

    if filtro_imagen:
        noticias = noticias.exclude(imagen__isnull=True).exclude(imagen='')

    if filtro_fecha == 'hoy':
        hoy = timezone.now().date()
        noticias = noticias.filter(fecha__date=hoy)
    elif filtro_fecha == 'semana':
        hace_una_semana = timezone.now() - timedelta(days=7)
        noticias = noticias.filter(fecha__gte=hace_una_semana)
    elif filtro_fecha == 'mes':
        hace_un_mes = timezone.now() - timedelta(days=30)
        noticias = noticias.filter(fecha__gte=hace_un_mes)

    noticias = noticias.order_by('-fecha', '-fecha_scraping')

    total_noticias = noticias.count()
    noticias_con_imagen = noticias.exclude(imagen__isnull=True).exclude(imagen='').count()

    context = {
        'noticias': noticias,
        'total_noticias': total_noticias,
        'noticias_con_imagen': noticias_con_imagen,
        'filtro_actual': {
            'imagen': filtro_imagen,
            'fecha': filtro_fecha,
            'busqueda': busqueda
        }
    }

    return render(request, 'noticias/economia.html', context)

def ejecutar_scraping_economia(request):
    """
    Llama al comando de scraping de Economía
    y devuelve el resultado en JSON.
    """
    if request.method == "POST":  # Seguridad: solo POST
        buffer = io.StringIO()
        try:
            call_command("scrape_economia", stdout=buffer)
            return JsonResponse({"status": "ok", "log": buffer.getvalue()})
        except Exception as e:
            return JsonResponse({"status": "error", "error": str(e)})
    return JsonResponse({"status": "error", "error": "Método no permitido"})

#Lista noticias por categoria Mundo
def mundo(request):
    filtro_imagen = request.GET.get('con_imagen', False)
    filtro_fecha = request.GET.get('fecha', 'todas')
    busqueda = request.GET.get('q', '')

    # 🔹 Solo noticias de mundo
    noticias = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"), enlace__icontains="/mundo/")

    if busqueda:
        noticias = noticias.filter(
            Q(titulo__icontains=busqueda) |
            Q(autor__icontains=busqueda)
        )

    if filtro_imagen:
        noticias = noticias.exclude(imagen__isnull=True).exclude(imagen='')

    if filtro_fecha == 'hoy':
        hoy = timezone.now().date()
        noticias = noticias.filter(fecha__date=hoy)
    elif filtro_fecha == 'semana':
        hace_una_semana = timezone.now() - timedelta(days=7)
        noticias = noticias.filter(fecha__gte=hace_una_semana)
    elif filtro_fecha == 'mes':
        hace_un_mes = timezone.now() - timedelta(days=30)
        noticias = noticias.filter(fecha__gte=hace_un_mes)

    noticias = noticias.order_by('-fecha', '-fecha_scraping')

    total_noticias = noticias.count()
    noticias_con_imagen = noticias.exclude(imagen__isnull=True).exclude(imagen='').count()

    context = {
        'noticias': noticias,
        'total_noticias': total_noticias,
        'noticias_con_imagen': noticias_con_imagen,
        'filtro_actual': {
            'imagen': filtro_imagen,
            'fecha': filtro_fecha,
            'busqueda': busqueda
        }
    }

    return render(request, 'noticias/mundo.html', context)

def ejecutar_scraping_mundo(request):
    """
    Llama al comando de scraping de Mundo
    y devuelve el resultado en JSON.
    """
    if request.method == "POST":  # Seguridad: solo POST
        buffer = io.StringIO()
        try:
            call_command("scrape_mundo", stdout=buffer)
            return JsonResponse({"status": "ok", "log": buffer.getvalue()})
        except Exception as e:
            return JsonResponse({"status": "error", "error": str(e)})
    return JsonResponse({"status": "error", "error": "Método no permitido"})

#Lista noticias por categoria Tecnologia
def tecnologia(request):
    filtro_imagen = request.GET.get('con_imagen', False)
    filtro_fecha = request.GET.get('fecha', 'todas')
    busqueda = request.GET.get('q', '')

    # 🔹 Solo noticias de tecnologia
    noticias = Noticia.objects.filter(Q(origen="elcomercio") | Q(origen="desconocido"), enlace__icontains="/tecnologia/")

    if busqueda:
        noticias = noticias.filter(
            Q(titulo__icontains=busqueda) |
            Q(autor__icontains=busqueda)
        )

    if filtro_imagen:
        noticias = noticias.exclude(imagen__isnull=True).exclude(imagen='')

    if filtro_fecha == 'hoy':
        hoy = timezone.now().date()
        noticias = noticias.filter(fecha__date=hoy)
    elif filtro_fecha == 'semana':
        hace_una_semana = timezone.now() - timedelta(days=7)
        noticias = noticias.filter(fecha__gte=hace_una_semana)
    elif filtro_fecha == 'mes':
        hace_un_mes = timezone.now() - timedelta(days=30)
        noticias = noticias.filter(fecha__gte=hace_un_mes)

    noticias = noticias.order_by('-fecha', '-fecha_scraping')

    total_noticias = noticias.count()
    noticias_con_imagen = noticias.exclude(imagen__isnull=True).exclude(imagen='').count()

    context = {
        'noticias': noticias,
        'total_noticias': total_noticias,
        'noticias_con_imagen': noticias_con_imagen,
        'filtro_actual': {
            'imagen': filtro_imagen,
            'fecha': filtro_fecha,
            'busqueda': busqueda
        }
    }

    return render(request, 'noticias/tecnologia.html', context)

def ejecutar_scraping_tecnologia(request):
    """
    Llama al comando de scraping de tecnología
    y devuelve el resultado en JSON.
    """
    if request.method == "POST":  # Seguridad: solo POST
        buffer = io.StringIO()
        try:
            call_command("scrape_tecnologia", stdout=buffer)
            return JsonResponse({"status": "ok", "log": buffer.getvalue()})
        except Exception as e:
            return JsonResponse({"status": "error", "error": str(e)})
    return JsonResponse({"status": "error", "error": "Método no permitido"})

'''
PERU21
'''
#Lista todas las noticias con filtros y estadísticas
def peru21(request):
    # Filtros
    filtro_imagen = request.GET.get('con_imagen', False)
    filtro_fecha = request.GET.get('fecha', 'todas')
    busqueda = request.GET.get('q', '')
    
    # Query base
    noticias = Noticia.objects.filter(origen='peru21')
    
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
    
    # Ordenar por fecha
    noticias = noticias.order_by('-fecha', '-fecha_scraping')
    
    # Estadísticas
    total_noticias = noticias.count()
    noticias_con_imagen = noticias.exclude(imagen__isnull=True).exclude(imagen='').count()
    
    context = {
        'noticias': noticias,
        'total_noticias': total_noticias,
        'noticias_con_imagen': noticias_con_imagen,
        'filtro_actual': {
            'imagen': filtro_imagen,
            'fecha': filtro_fecha,
            'busqueda': busqueda
        }
    }
    
    return render(request, 'peru21/peru21.html', context)