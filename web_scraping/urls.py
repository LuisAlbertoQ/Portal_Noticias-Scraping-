#URL configuration for web_scraping project.

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import bienvenida

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', bienvenida, name='bienvenida'),
    path('accounts/', include('accounts.urls')),
    path('noticias/', include('scraping.urls')),
    

] + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])