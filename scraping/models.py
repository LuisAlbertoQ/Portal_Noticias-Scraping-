from django.db import models
from django.contrib.auth.models import User

class Noticia(models.Model):
    titulo = models.CharField(max_length=255)
    autor = models.CharField(max_length=255, blank=True, null=True)
    fecha = models.DateTimeField(blank=True, null=True)
    imagen = models.TextField(blank=True, null=True)  # Cambiado a TextField para URLs largas
    enlace = models.TextField(blank=True, null=True)  # TextField para URLs largas
    origen = models.CharField(max_length=100, default='desconocido')
    fecha_scraping = models.DateTimeField(auto_now_add=True)  # Para saber cuándo se scrapeó
    
    class Meta:
        ordering = ['-fecha', '-fecha_scraping']  # Ordenar por fecha de publicación, luego por scraping
        
    def __str__(self):
        return f"[{self.origen}] {self.titulo}"

class NoticiasVistas(models.Model):
    usuario = models.ForeignKey(User, on_delete=models.CASCADE)
    noticia = models.ForeignKey(Noticia, on_delete=models.CASCADE)
    fecha_vista = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('usuario', 'noticia')
        ordering = ['-fecha_vista']
    
    def __str__(self):
        return f"{self.usuario.username} - {self.noticia.titulo}"