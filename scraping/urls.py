from django.urls import path
from . import views

urlpatterns = [
    path('', views.lista_noticias, name='lista_noticias'),
    path('scraping/lista', views.ejecutar_scraping_lista_noticias, name='scraping_lista_noticias'),
    path('politica', views.politica, name='politica'),
    path('scraping/politica', views.ejecutar_scraping_politica, name='scraping_politica'),
    path('economia', views.economia, name='economia'),
    path('scraping/economia', views.ejecutar_scraping_economia, name='scraping_economia'),
    path('mundo', views.mundo, name='mundo'),
    path('scraping/mundo', views.ejecutar_scraping_mundo, name='scraping_mundo'),
    path('tecnologia', views.tecnologia, name='tecnologia'),
    path('scraping/tecnologia', views.ejecutar_scraping_tecnologia, name='scraping_tecnologia'),
]