from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class Profile(models.Model):
    ROLE_CHOICES = [
        ('normal', 'Usuario Normal'),
        ('premium', 'Usuario Premium'),
        ('admin', 'Administrador'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='normal')
    
    def __str__(self):
        return f'{self.user.username} - {self.get_role_display()}'

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