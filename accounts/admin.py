# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import Profile

# Formulario personalizado para crear usuarios con email
class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True, label="Correo electrónico")
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False
    verbose_name_plural = 'Perfil'
    fields = ('role',)
    extra = 0

class SimpleUserAdmin(BaseUserAdmin):
    # Usar nuestro formulario personalizado para agregar usuarios
    add_form = CustomUserCreationForm
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'is_staff', 'is_superuser'),
        }),
    )
    
    list_display = ('username', 'email', 'first_name', 'last_name', 'get_role', 'is_staff', 'is_superuser')
    list_filter = BaseUserAdmin.list_filter + ('profile__role',)
    
    # Inline solo para edición, no para creación
    def get_inlines(self, request, obj=None):
        if obj:  # Solo mostrar inline si el usuario ya existe
            return (ProfileInline,)
        return ()
    
    def get_role(self, obj):
        try:
            return obj.profile.get_role_display()
        except Profile.DoesNotExist:
            return 'Sin rol'
    get_role.short_description = 'Rol'
    
    def save_model(self, request, obj, form, change):
        """
        Crear usuario y perfil automáticamente
        """
        super().save_model(request, obj, form, change)
        # Crear perfil solo si no existe (para nuevos usuarios)
        if not change:  # Si es un nuevo usuario
            Profile.objects.get_or_create(user=obj)

admin.site.unregister(User)
admin.site.register(User, SimpleUserAdmin)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'user_email', 'user_is_staff')
    list_filter = ('role',)
    search_fields = ('user__username', 'user__email')
    list_editable = ('role',)
    
    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'
    
    def user_is_staff(self, obj):
        return obj.user.is_staff
    user_is_staff.short_description = 'Es Staff'
    user_is_staff.boolean = True