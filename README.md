# 📰 Portal de Noticias con Scraping e IA - Web Scraping Django

Un **agregador inteligente de noticias peruanas** desarrollado en Django que extrae automáticamente contenido de **El Comercio** y **Perú21**, almacena en BD MySQL, y **analiza con IA** (OpenRouter) para extraer sentimiento, categorías y entidades. Incluye sistema de usuarios con roles, tareas asincrónicas con Celery y tracking de actividades.

## 🎯 ¿De qué trata el proyecto?

Este proyecto es un **sistema completo de agregación, análisis y gestión de noticias** que:

- 📰 **Extrae automáticamente** noticias de 2 portales peruanos (El Comercio + Perú21) cada 5 horas
- 🔍 **Scrapea 10 secciones:** Política, Economía, Mundo, Tecnología (El Comercio) + Deportes, Gastronomía, Investigación, Lima (Perú21)
- 🤖 **Analiza con IA** (OpenRouter/GPT): resumen, sentimiento, categoría, entidades, palabras clave
- 👥 **Gestiona usuarios** con roles: normal (gratis), premium (análisis ilimitado), admin (acceso total)
- 📊 **Registra actividades** de todos los usuarios (login, vistas, búsquedas, análisis, scraping)
- ⚡ **Ejecuta tareas asincrónicas** con Celery + Redis (sin bloquear la app)
- 🎨 **Interfaz moderna y responsive** con búsqueda, filtros avanzados y paginación

---

## 🛠️ Tecnologías Utilizadas

### Backend & Scraping
- **Django 5.2.6** - Framework web principal
- **Python 3.9+** - Lenguaje de programación
- **Celery 5.5.3** - Tareas asincrónicas
- **Redis 6.4.0** - Broker de mensajes
- **Playwright 1.55.0** - Automatización de navegadores (JavaScript enabled)
- **BeautifulSoup4 4.13.5** - Parsing y extracción de datos HTML
- **MySQL (mysqlclient 2.2.7)** - Base de datos relacional

### IA & APIs
- **OpenRouter (openai 2.8.1)** - Cliente para análisis con modelos LLM
- **Pydantic 2.12.4** - Validación de datos
- **httpx 0.28.1** - HTTP client asincrónico

### Frontend
- **HTML5/CSS3** - Interfaz de usuario responsive
- **JavaScript (vanilla)** - Interactividad y polling de tareas Celery
- **Bootstrap** - Estilos base
- **Font Awesome** - Iconografía

---

## 📋 Requisitos del Sistema

### Requisitos Hardware
- **Procesador:** 2GHz dual-core
- **RAM:** 4GB mínimo (8GB recomendado para Celery + BD)
- **Disco:** 500MB libre

### Requisitos Software
- **Python 3.9+** (3.13 recomendado)
- **MySQL 5.7+** o MariaDB 10.3+
- **Redis 6.0+** (para Celery broker)
- **pip** y **Git**

---

## 🚀 Manual de Despliegue (Ejecución Local)

### Prerequisitos: Instalar Dependencias del Sistema

#### **Windows**

**1. Instalar MySQL:**
- Descargar: https://dev.mysql.com/downloads/mysql/
- Ejecutar installer (Next → Next → Finish)
- Anotar usuario/password (por defecto: root/sin password)

**2. Instalar Redis (Opción A - Windows Subsystem for Linux 2):**
```powershell
# Abrir PowerShell como Admin
wsl --install
# Reiniciar y ejecutar en WSL:
sudo apt-get update && sudo apt-get install redis-server
```

**Opción B - Usar Docker:**
```powershell
# Si tienes Docker instalado
docker run -d -p 6379:6379 --name redis redis:latest
```

#### **macOS**

```bash
# Instalar MySQL
brew install mysql
brew services start mysql

# Instalar Redis
brew install redis
brew services start redis
```

#### **Linux (Ubuntu/Debian)**

```bash
sudo apt-get update
sudo apt-get install mysql-server redis-server

sudo systemctl start mysql
sudo systemctl start redis-server
```

---

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/LuisAlbertoQ/Portal_Noticias-Scraping-.git
cd Portal_Noticias-Scraping-
```

---

### Paso 2: Crear Entorno Virtual

```bash
# Windows (PowerShell)
python -m venv env
.\env\Scripts\Activate.ps1

# Windows (CMD)
python -m venv env
.\env\Scripts\activate.bat

# Linux/Mac
python -m venv env
source env/bin/activate
```

---

### Paso 3: Instalar Dependencias Python

```bash
pip install -r requirements.txt
```

---

### Paso 4: Instalar Navegadores de Playwright

```bash
playwright install chromium
```

---

### Paso 5: Configurar Variables de Entorno

**Crear archivo `.env` en la raíz del proyecto:**

```bash
# Windows (PowerShell)
@"
# Configuración General
DEBUG=True
SECRET_KEY=django-insecure-tu-clave-secreta-aqui-cambia-en-produccion
ALLOWED_HOSTS=127.0.0.1,localhost

# Base de Datos MySQL
DB_ENGINE=django.db.backends.mysql
DB_NAME=elcomercio_db
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306

# Celery + Redis
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_TIMEZONE=America/Lima

# OpenRouter (IA) - Obtén tu key en https://openrouter.ai
OPENROUTER_API_KEY=tu_api_key_aqui
OPENROUTER_MODEL=openai/gpt-3.5-turbo
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Sesiones
SESSION_COOKIE_AGE=3600
SESSION_SAVE_EVERY_REQUEST=True
SESSION_EXPIRE_AT_BROWSER_CLOSE=True
"@ | Out-File -Encoding UTF8 .env
```

```bash
# Linux/Mac
cat > .env << 'EOF'
# Configuración General
DEBUG=True
SECRET_KEY=django-insecure-tu-clave-secreta-aqui-cambia-en-produccion
ALLOWED_HOSTS=127.0.0.1,localhost

# Base de Datos MySQL
DB_ENGINE=django.db.backends.mysql
DB_NAME=elcomercio_db
DB_USER=root
DB_PASSWORD=
DB_HOST=127.0.0.1
DB_PORT=3306

# Celery + Redis
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_TIMEZONE=America/Lima

# OpenRouter (IA) - Obtén tu key en https://openrouter.ai
OPENROUTER_API_KEY=tu_api_key_aqui
OPENROUTER_MODEL=openai/gpt-3.5-turbo
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Sesiones
SESSION_COOKIE_AGE=3600
SESSION_SAVE_EVERY_REQUEST=True
SESSION_EXPIRE_AT_BROWSER_CLOSE=True
EOF
```

---

### Paso 6: Crear Base de Datos MySQL

```bash
# Opción 1: Con MySQL CLI (interactivo)
mysql -u root -p
# Luego ejecutar en MySQL:
# CREATE DATABASE elcomercio_db;
# EXIT;

# Opción 2: Directamente (sin contraseña)
mysql -u root -e "CREATE DATABASE elcomercio_db;"
```

---

### Paso 7: Ejecutar Migraciones de BD

```bash
python manage.py migrate
```

---

### Paso 8: Crear Superusuario (Admin)

```bash
python manage.py createsuperuser
```

Responde las preguntas interactivas:
- **Username:** admin (o tu nombre)
- **Email:** admin@example.com
- **Password:** (elige una contraseña)

---

### Paso 9: Recolectar Archivos Estáticos

```bash
python manage.py collectstatic --noinput
```

---

## ⚡ Manual de Ejecución Local

### Opción A: Ejecución Simple (SIN Tareas Asincrónicas)

**Terminal 1: Django Development Server**

```bash
python manage.py runserver
```

✅ Accede a: **http://127.0.0.1:8000**

⚠️ **Limitaciones:** El scraping automático y análisis de IA no funcionarán sin Celery/Redis.

---

### Opción B: Ejecución Completa (RECOMENDADO - Con Celery + Redis)

**Requisito previo:** Verificar que Redis está corriendo

```bash
# Verificar Redis
redis-cli ping
# Debe responder: PONG
```

**Terminal 1: Django Development Server**

```bash
python manage.py runserver
```

**Terminal 2: Celery Worker** (ejecuta tareas asincrónicas)

```bash
celery -A web_scraping worker --loglevel=info --pool=solo
```

**Terminal 3: Celery Beat** (ejecuta scraping cada 5 horas)

```bash
python manage.py cleaned_beat
```

O sin limpieza automática:

```bash
celery -A web_scraping beat --loglevel=info
```

**Terminal 4: Redis Server** (si no está ejecutándose como servicio)

```bash
# En WSL/Linux/Mac
redis-server

# En Windows (si usaste Docker)
docker run -d -p 6379:6379 redis
```

---

## 🌐 Acceso a la Aplicación

Una vez ejecutando, accede a:

| URL | Descripción | Requiere Login |
|-----|------------|----------------|
| http://127.0.0.1:8000 | Página principal / Bienvenida | ❌ |
| http://127.0.0.1:8000/accounts/register | Registro de usuarios | ❌ |
| http://127.0.0.1:8000/accounts/login | Iniciar sesión | ❌ |
| http://127.0.0.1:8000/accounts/profile | Perfil de usuario | ✅ |
| http://127.0.0.1:8000/scraping/elcomercio | Noticias El Comercio | ✅ |
| http://127.0.0.1:8000/scraping/peru21 | Noticias Perú21 | ✅ |
| http://127.0.0.1:8000/analisis | Análisis de noticias | ✅ Premium/Admin |
| http://127.0.0.1:8000/admin | Panel de administración | ✅ Admin |

---

## 📖 Manual de Usuario

### 1. Registro e Inicio de Sesión

**Crear una cuenta nueva:**
1. Ir a `/accounts/register`
2. Llenar: Username, Email, Contraseña
3. Hacer clic en "Registrarse"
4. Serás redirigido automáticamente al listado de noticias

**Iniciar sesión:**
1. Ir a `/accounts/login`
2. Ingresar Username/Email y Contraseña
3. Hacer clic en "Iniciar Sesión"

---

### 2. Visualizar Noticias

**Secciones disponibles:**

**El Comercio:**
- `/scraping/elcomercio` - Todas las noticias
- `/scraping/elcomercio/politica` - Sección Política
- `/scraping/elcomercio/economia` - Sección Economía
- `/scraping/elcomercio/mundo` - Sección Mundo
- `/scraping/elcomercio/tecnologia` - Sección Tecnología

**Perú21:**
- `/scraping/peru21` - Todas las noticias
- `/scraping/peru21/deportes` - Sección Deportes
- `/scraping/peru21/gastronomia` - Sección Gastronomía
- `/scraping/peru21/investigacion` - Sección Investigación
- `/scraping/peru21/lima` - Sección Lima

---

### 3. Filtrar y Buscar Noticias

En cualquier página de noticias, tienes:

**🔍 Búsqueda:**
- Ingresa término en la barra de búsqueda
- Busca por **título** o **autor**

**📅 Filtrar por fecha:**
- **Hoy** - Noticias de hoy
- **Ayer** - Noticias de ayer
- **Última semana** - Últimos 7 días
- **Último mes** - Últimos 30 días
- **Rango personalizado** - Selecciona fechas específicas

**🖼️ Filtrar por imagen:**
- Marca "Solo noticias con imagen"

**📊 Paginación:**
- Selecciona 10, 20 o 50 noticias por página

---

### 4. Analizar Noticias con IA (Premium)

Para acceder a esta función, necesitas ser **usuario Premium**.

**Actualizar a Premium:**
1. Ir a tu Perfil (`/accounts/profile`)
2. Hacer clic en "Planes y Suscripción"
3. Hacer clic en "Actualizar a Premium"
4. Confirmar (simulado - en producción usarías Stripe)

**Analizar una noticia:**
1. Ir a `/analisis` (solo disponible para premium)
2. Seleccionar una noticia que deseas analizar
3. Hacer clic en botón "Analizar"
4. Esperar a que Celery procese (puede tomar 5-30s)
5. Ver resultados: **Resumen, Sentimiento, Categoría, Entidades, Palabras Clave**

**Ver mis análisis:**
1. En tu Perfil (`/accounts/profile`), sección "Mis Análisis Recientes"
2. O ir directamente a `/analisis/mis-analisis/`

---

### 5. Ejecutar Scraping

#### **Vía Web UI (Recomendado):**
1. En cualquier página de noticias (El Comercio o Perú21)
2. Hacer clic en botón "Ejecutar Scraping" (solo premium/admin)
3. Se abrirá modal con progreso en tiempo real
4. Esperar a que termine (5-15 minutos según cantidad)

#### **Vía Línea de Comandos (Manual):**

```bash
# Todas las secciones a la vez
python manage.py scrape_all_sections

# El Comercio (todas las secciones)
python manage.py scrape_elcomercio
python manage.py scrape_economia
python manage.py scrape_elcomercio_pol
python manage.py scrape_mundo
python manage.py scrape_tecnologia

# Perú21 (todas las secciones)
python manage.py scrape_peru21
python manage.py scrape_peru21D  # Deportes
python manage.py scrape_peru21G  # Gastronomía
python manage.py scrape_peru21I  # Investigación
python manage.py scrape_peru21L  # Lima
```

---

### 6. Ver Perfil y Actividades

En tu Perfil (`/accounts/profile`), verás:

- **📊 Estadísticas Personales:**
  - Días que llevas activo
  - Noticias vistas
  - Análisis realizados
  - Rol actual (Normal/Premium/Admin)

- **📰 Noticias Vistas Recientemente:** Últimas 5 noticias que abriste

- **🤖 Análisis Recientes:** Últimos 5 análisis de IA realizados

- **📝 Actividades Recientes:** Historial de login, búsquedas, vistas, compartidas, etc.

---

### 7. Compartir Noticias

En cada noticia, hay botones para compartir (simulado en frontend):
- **Facebook**
- **Twitter/X**
- **WhatsApp**
- **Email**

Cada compartir se registra en tu historial de actividades.

---

### 8. Panel de Administración

**Solo para Admins:**

Accede a `/admin/` con credenciales de superusuario.

Desde aquí puedes:

- **Gestionar Usuarios:** Ver, crear, editar roles
- **Ver Perfiles:** Información de cada usuario
- **Gestionar Noticias:** Crear, editar, eliminar noticias
- **Ver Análisis:** Historial de análisis realizados
- **Ver Actividades:** Auditoría completa de qué hizo cada usuario
- **Gestionar Grupos:** (Django built-in)

---

## 🔧 Comandos Útiles

### Desarrollo

```bash
# Iniciar servidor de desarrollo
python manage.py runserver

# Crear migraciones (después de cambiar models.py)
python manage.py makemigrations

# Aplicar migraciones
python manage.py migrate

# Acceder al shell de Django
python manage.py shell

# Ver estado de migraciones
python manage.py showmigrations

# Resetear base de datos COMPLETA (⚠️ borra todo)
python manage.py flush
```

### Scraping Manual

```bash
# Todas las secciones
python manage.py scrape_all_sections

# El Comercio
python manage.py scrape_elcomercio
python manage.py scrape_economia
python manage.py scrape_elcomercio_pol
python manage.py scrape_mundo
python manage.py scrape_tecnologia

# Perú21
python manage.py scrape_peru21
python manage.py scrape_peru21D
python manage.py scrape_peru21G
python manage.py scrape_peru21I
python manage.py scrape_peru21L
```

### Celery

```bash
# Worker (ejecuta tareas)
celery -A web_scraping worker --loglevel=info --pool=solo

# Beat (ejecuta tareas programadas)
celery -A web_scraping beat --loglevel=info

# Con limpieza automática de schedule
python manage.py cleaned_beat

# Monitorear tasks (en otra terminal)
celery -A web_scraping events
```

---

## 📊 Estructura del Proyecto

```
Portal_Noticias-Scraping-/
├── accounts/                          # Gestión de usuarios
│   ├── models.py                     # Profile, Actividad
│   ├── views.py                      # Auth (login, register, profile, premium)
│   ├── forms.py                      # RegistroForm
│   ├── admin.py                      # Admin personalizado
│   └── urls.py                       # Rutas
│
├── scraping/                          # Web scraping
│   ├── models.py                     # Noticia, NoticiasVistas
│   ├── views.py                      # Listados por sección
│   ├── tasks.py                      # Celery tasks
│   ├── urls.py                       # Rutas
│   ├── management/commands/          # Django commands
│   │   ├── scrape_elcomercio.py
│   │   ├── scrape_economia.py
│   │   ├── scrape_elcomercio_pol.py
│   │   ├── scrape_mundo.py
│   │   ├── scrape_tecnologia.py
│   │   ├── scrape_peru21.py
│   │   ├── scrape_peru21D.py
│   │   ├── scrape_peru21G.py
│   │   ├── scrape_peru21I.py
│   │   ├── scrape_peru21L.py
│   │   └── cleaned_beat.py
│   └── templates/                    # HTML templates
│
├── analisis/                          # Análisis con IA
│   ├── models.py                     # AnalisisNoticia
│   ├── views.py                      # API endpoints
│   ├── tasks.py                      # analizar_noticia_task
│   ├── urls.py                       # Rutas
│   └── admin.py                      # Admin
│
├── web_scraping/                      # Configuración Django
│   ├── settings.py                   # Configuración global
│   ├── celery.py                     # Configuración Celery
│   ├── urls.py                       # URLs globales
│   └── wsgi.py                       # WSGI app
│
├── templates/                         # Plantillas globales
│   ├── base.html                     # Base template
│   └── ...
│
├── static/                            # CSS, JS, imágenes
│   ├── css/
│   └── js/
│
├── manage.py                          # Script de gestión Django
├── requirements.txt                   # Dependencias
├── ANALISIS_PROYECTO.md               # Análisis técnico completo
└── README.md                          # Este archivo
```

---

## 🐛 Solución de Problemas

### Error: "No such table: accounts_profile"

**Solución:**
```bash
python manage.py migrate
```

### Error: "Connection refused" en Redis

**Solución:**
```bash
# Verificar Redis está corriendo
redis-cli ping
# Si no: iniciar Redis
redis-server

# En Windows (si usas Docker)
docker run -d -p 6379:6379 redis
```

### Error: "Database doesn't exist"

**Solución:**
```bash
# Crear BD
mysql -u root -e "CREATE DATABASE elcomercio_db;"

# O manualmente:
mysql -u root -p
# CREATE DATABASE elcomercio_db;
```

### Error: "No module named 'django'"

**Solución:**
```bash
# Verificar que el venv está activado
# Luego reinstalar:
pip install -r requirements.txt
```

### Error: "Playwright: browser not found"

**Solución:**
```bash
playwright install chromium
```

### El scraping se queda en "Procesando..."

**Posibles causas:**
1. Celery worker no está corriendo (Terminal 2)
2. Redis no está disponible
3. Las URLs de los portales cambiaron (selectors rotos)

**Solución:**
```bash
# Ver logs de Celery worker para debug
celery -A web_scraping worker --loglevel=debug --pool=solo
```

---

## 📊 Características Implementadas

- ✅ **Scraping inteligente** de 2 portales peruanos (10 secciones)
- ✅ **Base de datos MySQL** con relaciones optimizadas
- ✅ **Autenticación** con roles (normal, premium, admin)
- ✅ **Análisis con IA** (OpenRouter): sentimiento, categorías, entidades
- ✅ **Tareas asincrónicas** (Celery + Redis)
- ✅ **Scraping automático** cada 5 horas (Celery Beat)
- ✅ **Tracking de actividades** de usuarios
- ✅ **Interfaz responsive** con filtros avanzados
- ✅ **Búsqueda** por título y autor
- ✅ **Paginación** configurable
- ✅ **Panel admin** personalizado
- ✅ **Manejo robusto de errores** y timeouts

---

## 🚧 Áreas de Mejora

- [ ] Dockerización (Dockerfile + docker-compose.yml)
- [ ] Tests unitarios (pytest-django)
- [ ] CI/CD (GitHub Actions)
- [ ] WebSocket real-time (en lugar de polling)
- [ ] Exportar análisis a PDF
- [ ] Notificaciones por email
- [ ] Dashboard de analítica (admin)
- [ ] API REST pública (OAuth2)
- [ ] Integración redes sociales
- [ ] Almacenamiento S3 para imágenes

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 👨‍💻 Autor

- **Luis Alberto Q** - [@LuisAlbertoQ](https://github.com/LuisAlbertoQ)

---

## 📞 Soporte

Si tienes problemas o preguntas:
- Abre un [Issue en GitHub](https://github.com/LuisAlbertoQ/Portal_Noticias-Scraping-/issues)
- Revisa [ANALISIS_PROYECTO.md](ANALISIS_PROYECTO.md) para detalles técnicos

---

**¡Disfruta analizando noticias con IA! 📰✨**
