# accounts/views.py
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from scraping.models import Noticia

from .forms import RegistroForm



# Vista de bienvenida (página principal)
def bienvenida(request):
    total_noticias = Noticia.objects.count()
    noticias_con_imagen = Noticia.objects.exclude(imagen__isnull=True).exclude(imagen='').count()

    return render(request, 'bienvenida.html', {
        "total_noticias": total_noticias,
        "noticias_con_imagen": noticias_con_imagen,
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
    return render(request, 'accounts/profile.html', {
        'user': request.user,
        'role': request.user.profile.get_role_display()
    })