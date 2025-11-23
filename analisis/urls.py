# analisis/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.lista_noticias_analisis, name='analisis_lista'),
    path('resultado/<int:analisis_id>/', views.ver_resultado_analisis, name='analisis_resultado'),
    
    # API endpoints
    path('api/iniciar/<int:noticia_id>/', views.api_iniciar_analisis, name='api_iniciar_analisis'),
    path('api/estado/<str:task_id>/', views.api_estado_analisis, name='api_estado_analisis'),
    path('api/ultimo/<int:noticia_id>/', views.api_ultimo_analisis, name='api_ultimo_analisis'),
    
    path('mis-analisis/', views.mis_analisis, name='mis_analisis'),
]