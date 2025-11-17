from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from scraping.models import Noticia

class Profile(models.Model):
    ROLE_CHOICES = [
        ('normal', 'Usuario Normal'),
        ('premium', 'Usuario Premium'),
        ('admin', 'Administrador'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='normal')
    fecha_registro = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f'{self.user.username} - {self.get_role_display()}'
    
    def dias_activo(self):
        """Calcula los días que el usuario ha estado activo"""
        if self.fecha_registro:
            # Calcular diferencia en días de forma más precisa
            from datetime import timedelta
            diferencia = timezone.now() - self.fecha_registro
            dias = diferencia.days
                    # Si han pasado más de 24 horas desde el registro, suma 1 día
            if diferencia > timedelta(days=dias):
                dias += 1
            return max(1, dias)
        return 1
    
    def es_usuario_nuevo(self):
        """Determina si el usuario es nuevo (menos de 7 días)"""
        return self.dias_activo() <= 7

class Actividad(models.Model):
    TIPO_CHOICES = [
        ('vista', 'Vio noticia'),
        ('busqueda', 'Realizó búsqueda'),
        ('compartir', 'Compartió noticia'),
        ('login', 'Inició sesión'),
        ('scraping', 'Ejecutó scraping'),
    ]
    
    usuario = models.ForeignKey(User, on_delete=models.CASCADE, related_name='actividades')
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    noticia = models.ForeignKey(Noticia, on_delete=models.SET_NULL, null=True, blank=True)
    datos_extra = models.JSONField(default=dict, blank=True)  # Para guardar búsquedas, etc.
    fecha_actividad = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha_actividad']
        verbose_name_plural = 'Actividades'
    
    def __str__(self):
        return f"{self.usuario.username} - {self.get_tipo_display()} - {self.fecha_actividad.strftime('%d/%m/%Y %H:%M')}"
    
    def tiempo_relativo(self):
        """Devuelve el tiempo relativo (Hace X tiempo)"""
        from django.utils.timesince import timesince
        return f"Hace {timesince(self.fecha_actividad)}"

# ========== SEÑALES CORREGIDAS ==========
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        profile = Profile.objects.create(user=instance)
        # Si es superusuario, asignar rol admin automáticamente
        if instance.is_superuser:
            profile.role = 'admin'
            profile.save()

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()