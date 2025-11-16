from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

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