from django.db import models
from django.contrib.auth.models import User
from scraping.models import Noticia
import json

class AnalisisNoticia(models.Model):
    # 🔥 CAMBIO: ForeignKey en lugar de OneToOneField
    noticia = models.ForeignKey(Noticia, on_delete=models.CASCADE, related_name='analisis')
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analisis')
    
    # Resultados del análisis
    resumen = models.TextField(blank=True, null=True)
    sentimiento = models.CharField(max_length=20, blank=True, null=True)
    sentimiento_confianza = models.FloatField(default=0.0)
    categoria = models.CharField(max_length=100, blank=True, null=True)
    entidades = models.JSONField(default=dict, blank=True)
    palabras_clave = models.JSONField(default=list, blank=True)
    task_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Metadata
    estado = models.CharField(
        max_length=20,
        choices=[
            ('pendiente', 'Pendiente'),
            ('en_proceso', 'En Proceso'),
            ('completado', 'Completado'),
            ('error', 'Error')
        ],
        default='pendiente'
    )
    
    tokens_usados = models.IntegerField(default=0)
    coste_estimado = models.DecimalField(max_digits=6, decimal_places=4, default=0.0)
    
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-creado_en']
        verbose_name = 'Análisis de Noticia'
        verbose_name_plural = 'Análisis de Noticias'
        indexes = [
            models.Index(fields=['usuario', 'estado']),
        ]
        # 🔥 EVITA DUPLICADOS: Un usuario solo puede tener un análisis por noticia
        unique_together = ['noticia', 'usuario']
    
    def __str__(self):
        return f"Análisis #{self.id} - {self.noticia.titulo[:50]} - {self.usuario.username}"
    
    def get_sentimiento_color(self):
        colors = {
            'positivo': 'text-success',
            'neutro': 'text-warning',
            'negativo': 'text-danger'
        }
        return colors.get(self.sentimiento, 'text-muted')
    
    def get_entidades_count(self):
        return sum(len(v) for v in self.entidades.values())