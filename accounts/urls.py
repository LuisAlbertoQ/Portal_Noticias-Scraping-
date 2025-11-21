from django.urls import path
from . import views
urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('obtener-contador-vistas/', views.obtener_contador_vistas, name='obtener_contador_vistas'),
    
    # Nuevas rutas para planes y actualización
    path('planes/', views.planes, name='planes'),
    path('upgrade/', views.upgrade_premium, name='upgrade_premium'),
    path('payment/success/', views.payment_success, name='payment_success'),
]