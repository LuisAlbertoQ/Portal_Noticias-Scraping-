# accounts/views.py
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from scraping.models import Noticia, NoticiasVistas
from accounts.utils import registrar_login
from .models import Actividad

from .forms import RegistroForm



# Vista de bienvenida (página principal)
def bienvenida(request):
    total_noticias = Noticia.objects.count()
    noticias_con_imagen = Noticia.objects.exclude(imagen__isnull=True).exclude(imagen='').count()

    # Obtener estadísticas de noticias vistas (si el usuario está autenticado)
    noticias_vistas_count = 0
    dias_activo = 0
    
    if request.user.is_authenticated:
        noticias_vistas_count = NoticiasVistas.objects.filter(usuario=request.user).count()
        dias_activo = request.user.profile.dias_activo()

    return render(request, 'bienvenida.html', {
        "total_noticias": total_noticias,
        "noticias_con_imagen": noticias_con_imagen,
        "noticias_vistas_count": noticias_vistas_count,
        "dias_activo": dias_activo
    })
    

# Registro de usuarios
def register(request):
    # Si ya está autenticado en el sitio principal, redirigir
    if request.user.is_authenticated and not request.path.startswith('/admin/'):
        messages.info(request, "Ya tienes una sesión activa en el sitio.")
        return redirect('profile')
    
    if request.method == 'POST':
        form = RegistroForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'¡Cuenta creada para {user.username}!')
            return redirect('lista_noticias')
    else:
        form = RegistroForm()
    return render(request, 'accounts/register.html', {'form': form})

# Inicio de sesión para el SITIO PRINCIPAL
def user_login(request):
    # Si ya está autenticado en el sitio principal, redirigir
    if request.user.is_authenticated and not request.path.startswith('/admin/'):
        messages.info(request, "Ya tienes una sesión activa.")
        return redirect('profile')
    
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                
                # REGISTRAR ACTIVIDAD DE LOGIN
                registrar_login(user)
                messages.success(request, f'¡Bienvenido {user.username}!')
                
                # Si el usuario es staff y viene del admin, redirigir al admin
                next_url = request.GET.get('next', '')
                if user.is_staff and ('/admin/' in next_url or '/admin' in next_url):
                    return redirect('/admin/')
                
                return redirect('lista_noticias')
            else:
                messages.error(request, "Credenciales inválidas.")
        else:
            messages.error(request, "Por favor corrige los errores.")
    else:
        form = AuthenticationForm()
    return render(request, 'accounts/login.html', {'form': form})

# Cierre de sesión del SITIO PRINCIPAL
def user_logout(request):
    if request.user.is_authenticated:
        username = request.user.username
        logout(request)
        messages.success(request, f'¡Hasta pronto {username}!')
    return redirect('bienvenida')

# Perfil de usuario
@login_required
def profile(request):
    # Obtener estadísticas del usuario
    noticias_vistas_count = NoticiasVistas.objects.filter(usuario=request.user).count()
    dias_activo = request.user.profile.dias_activo()
    
        # Obtener actividades recientes (últimas 10)
    actividades_recientes = Actividad.objects.filter(
        usuario=request.user
    ).select_related('noticia').order_by('-fecha_actividad')[:5]
    
    # Obtener las noticias más recientes vistas
    noticias_recientes_vistas = NoticiasVistas.objects.filter(
        usuario=request.user
    ).select_related('noticia').order_by('-fecha_vista')[:5]
    
    return render(request, 'accounts/profile.html', {
        'user': request.user,
        'role': request.user.profile.get_role_display(),
        'noticias_vistas_count': noticias_vistas_count,
        'dias_activo': dias_activo,
        'noticias_recientes_vistas': noticias_recientes_vistas,
        'actividades_recientes': actividades_recientes,
        'es_usuario_nuevo': request.user.profile.es_usuario_nuevo(),
    })

@login_required
def obtener_contador_vistas(request):
    """API para obtener el contador de noticias vistas del usuario"""
    count = NoticiasVistas.objects.filter(usuario=request.user).count()
    return JsonResponse({'count': count})