# 📰 Análisis Completo del Proyecto "Portal de Noticias con Scraping e IA"

**Fecha de Análisis:** 26 de noviembre de 2025  
**Última Actualización del README:** Desactualizado (ver recomendaciones al final)

---

## 🎯 Propósito General del Proyecto

Es una **plataforma web de agregación de noticias** que:
1. **Scrapea noticias** automáticamente de dos portales peruanos: El Comercio y Perú21
2. **Almacena** las noticias en una BD MySQL con control de usuarios
3. **Analiza** noticias con IA (OpenRouter) para extraer resumen, sentimiento, categoría y entidades
4. **Gestiona usuarios** con roles (normal, premium, admin) y seguimiento de actividades
5. **Ejecuta tareas asincrónicas** via Celery + Redis para scraping y análisis sin bloquear

---

## 📱 Estructura del Proyecto

```
web_scraping/                    # Proyecto Django principal
├── settings.py                  # Configuración (Django, BD, Celery, OpenRouter)
├── celery.py                    # Configuración de Celery
├── urls.py                      # URLs globales
├── wsgi.py / asgi.py           # Interfaces de servidor

accounts/                        # Gestión de usuarios y perfiles
├── models.py                   # Profile (roles), Actividad
├── views.py                    # Auth (login, register, profile, premium)
├── forms.py                    # RegistroForm
├── admin.py                    # Admin personalizado
└── urls.py                     # Rutas de usuarios

scraping/                        # Web scraping de noticias
├── models.py                   # Noticia, NoticiasVistas
├── views.py                    # Listados de noticias por sección
├── tasks.py                    # scrape_all_sections, run_single_scrape (Celery)
├── urls.py                     # Rutas de scraping y noticias
└── management/commands/        # Django commands para scrapers
    ├── scrape_elcomercio.py    # Scrapea El Comercio (Playwright)
    ├── scrape_economia.py      # Sección Economía de El Comercio
    ├── scrape_elcomercio_pol.py # Sección Política de El Comercio
    ├── scrape_mundo.py         # Sección Mundo de El Comercio
    ├── scrape_tecnologia.py    # Sección Tecnología de El Comercio
    ├── scrape_peru21.py        # Scrapea Perú21 (Playwright)
    ├── scrape_peru21D.py       # Sección Deportes de Perú21
    ├── scrape_peru21G.py       # Sección Gastronomía de Perú21
    ├── scrape_peru21I.py       # Sección Investigación de Perú21
    ├── scrape_peru21L.py       # Sección Lima de Perú21
    └── cleaned_beat.py         # Arranca Beat limpiando schedule

analisis/                        # Análisis de noticias con IA
├── models.py                   # AnalisisNoticia (resumen, sentimiento, etc.)
├── views.py                    # API endpoints para iniciar/consultar análisis
├── tasks.py                    # analizar_noticia_task (Celery)
├── urls.py                     # Rutas de análisis
└── admin.py                    # Admin de análisis

templates/                       # Plantillas HTML (Bootstrap, JS interactivo)
├── base.html                   # Base principal
├── accounts/                   # Login, registro, perfil, planes
├── noticias/                   # Listados de El Comercio por sección
├── peru21/                     # Listados de Perú21 por sección
└── analisis/                   # Resultados de análisis

static/                         # CSS, JS
└── [css, js]/

requirements.txt               # Dependencias
```

---

## 🔧 Configuración Técnica

### **Stack Tecnológico**

| Componente | Tecnología | Versión |
|-----------|-----------|---------|
| **Framework Web** | Django | 5.2.6 |
| **Motor de Colas** | Celery | 5.5.3 |
| **Broker de Mensajes** | Redis | Configurado en settings |
| **Scraping** | Playwright | 1.55.0 |
| **Parsing HTML** | BeautifulSoup4 | 4.13.5 |
| **IA (análisis)** | OpenAI (via OpenRouter) | 2.8.1 |
| **BD** | MySQL | Via `mysqlclient==2.2.7` |
| **Autenticación JWT** | PyJWT | 2.10.1 |
| **Validación de datos** | Pydantic | 2.12.4 |
| **HTTP** | httpx, requests | 0.28.1, 2.32.5 |
| **Parsing de datos** | python-dateutil | 2.9.0.post0 |

### **Base de Datos**

```python
# settings.py - Configuración MySQL
DATABASES = {
    'default': {
        'ENGINE': os.getenv('DB_ENGINE', 'django.db.backends.mysql'),
        'NAME': os.getenv('DB_NAME', 'elcomercio_db'),
        'USER': os.getenv('DB_USER', 'root'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'localhost'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'sql_mode': 'traditional',
            'charset': 'utf8mb4',
            'use_unicode': True,
        },
    }
}
```

### **Configuración Celery**

```python
# settings.py
CELERY_BROKER_URL = 'redis://localhost:6379/0'        # Redis como broker
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'    # Almacenar resultados en Redis
CELERY_TIMEZONE = 'America/Lima'
CELERY_BEAT_SCHEDULE = {
    'scrape-all-every-5-hours': {
        'task': 'scraping.tasks.scrape_all_sections',
        'schedule': 5 * 60 * 60.0,  # 5 horas
    },
}
```

**Comandos para ejecutar Celery:**
```bash
# Worker (ejecuta las tareas)
celery -A web_scraping worker --loglevel=info --pool=solo

# Beat (ejecuta tareas programadas)
python manage.py cleaned_beat  # Con limpieza automática de schedule
```

### **Configuración OpenRouter (IA)**

```python
# settings.py - Se carga desde .env
OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
OPENROUTER_MODEL = os.getenv('OPENROUTER_MODEL', 'openai/gpt-3.5-turbo')
OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
```

---

## 📚 Descripción Detallada de Apps

### **1️⃣ App `accounts` - Gestión de Usuarios**

**Propósito:** Autenticación, perfiles de usuario, roles, historial de actividades.

#### **Modelos:**
- **`Profile`** 
  - OneToOneField a User (Django built-in)
  - Roles: `normal`, `premium`, `admin`
  - Campo `fecha_registro`: Cuándo se registró el usuario
  - Métodos útiles:
    - `dias_activo()`: Calcula días desde el registro
    - `es_usuario_nuevo()`: True si tiene < 7 días

- **`Actividad`**
  - Registra TODAS las acciones del usuario
  - Tipos: `vista`, `busqueda`, `compartir`, `login`, `scraping`
  - Almacena FK a Noticia y datos extras (JSON)
  - Ordenado por `-fecha_actividad`

#### **Vistas principales:**
- `register()`: Registro público (rol siempre `normal`)
- `user_login()`: Login con registro de actividad
- `profile()`: Panel de usuario con stats (noticias vistas, análisis, actividades)
- `planes()`: Muestra planes disponibles
- `upgrade_premium()`: Cambiar rol a `premium`
- `cancelar_premium()`: Volver a rol `normal`

#### **Admin personalizado:**
- Interfaz mejorada para crear usuarios con email obligatorio
- Inline de Profile para editar rol desde User
- Lista filtrable de usuarios por rol

---

### **2️⃣ App `scraping` - Web Scraping de Noticias**

**Propósito:** Extraer noticias de El Comercio y Perú21, almacenarlas en BD.

#### **Modelos:**
- **`Noticia`**
  - Campos: `titulo`, `autor`, `fecha`, `imagen` (URL), `enlace` (URL), `origen` (elcomercio/peru21), `fecha_scraping`
  - Ordenado por `-fecha, -fecha_scraping`
  - Clave única: `titulo + origen` (no duplica noticias)

- **`NoticiasVistas`**
  - Tracking: Qué usuario vio qué noticia
  - unique_together: `(usuario, noticia)`
  - Clave para mostrar "noticias vistas" en el perfil

#### **Scrapers (Management Commands):**

**El Comercio (6 comandos):**
1. `scrape_elcomercio` - Todas las secciones desde portada
2. `scrape_economia` - Sección Economía
3. `scrape_elcomercio_pol` - Sección Política
4. `scrape_mundo` - Sección Mundo
5. `scrape_tecnologia` - Sección Tecnología

**Perú21 (6 comandos):**
1. `scrape_peru21` - Portada general
2. `scrape_peru21D` - Deportes
3. `scrape_peru21G` - Gastronomía
4. `scrape_peru21I` - Investigación
5. `scrape_peru21L` - Lima

**Características técnicas:**
- Usan **Playwright** para navegación (JavaScript enabled)
- Detectan y extraen imágenes de alta calidad
- Manejan lazy-loading
- User-Agent realista
- Timeouts configurados (480s a 1800s según sección)
- Transacciones DB para consistencia
- Logging detallado con emojis 📰 📄 ✅ ❌
- Progress tracking en tiempo real

**Ejemplo: `scrape_elcomercio.py`**
```python
# Selectors específicos del HTML de El Comercio
# Busca imágenes con clase "fs-wi__img"
# Extrae resolución de URLs tipo "...width=800&height=600..."
# Detecta enlaces a noticias en ".fs-wi__title a"
# Obtiene fecha de atributo "datetime" en <time>
```

#### **Vistas (lista de noticias):**
- `lista_noticias()` - El Comercio completo
- `politica()` - Sección Política
- `economia()` - Sección Economía
- `mundo()`, `tecnologia()` - Igual
- `peru21()`, `peru21d()`, `peru21g()`, `peru21i()`, `peru21l()` - Perú21 por sección

**Filtros disponibles en todas:**
- `?q=busqueda` - Búsqueda por título/autor
- `?con_imagen=1` - Solo noticias con imagen
- `?fecha=hoy/ayer/semana/mes/rango` - Filtrar por fecha
- `?per_page=10/20/50` - Paginación
- Registra búsquedas en tabla `Actividad`

#### **Vistas (ejecución de scraping):**
- Endpoints POST que lanzan tareas Celery asincrónicas
- Verifican rol premium/admin
- Registran actividad en tabla `Actividad`
- Devuelven `task_id` de Celery para monitoreo

#### **Tasks (Celery):**
- **`scrape_all_sections()`**: Ejecuta todos los scrapers en secuencia
- **`run_single_scrape(command_name)`**: Ejecuta un scraper específico
  - Monitorea progreso en tiempo real
  - Actualiza estado Celery cada 3 segundos
  - Detecta outputs como "Se encontraron X noticias"
  - Calcula porcentaje completado
  - Timeout robusto con margen de seguridad
  - Retorna resumen: noticias procesadas, tiempo, éxito/error

---

### **3️⃣ App `analisis` - Análisis de Noticias con IA**

**Propósito:** Analizar contenido de noticias usando modelos de IA via OpenRouter.

#### **Modelos:**
- **`AnalisisNoticia`**
  - FK a `Noticia` + FK a `User` (único: un análisis por usuario/noticia)
  - Campos de resultado:
    - `resumen` (TextField): Resumen ejecutivo
    - `sentimiento` (positivo/neutro/negativo)
    - `sentimiento_confianza` (0-1)
    - `categoria` (Política, Economía, Tech, etc.)
    - `entidades` (JSON): Personas, organizaciones, lugares
    - `palabras_clave` (JSON array): 5 keywords ordenadas
  - Metadata: `estado` (pendiente/en_proceso/completado/error)
  - Tracking de tokens y costo estimado
  - Index en `(usuario, estado)`

#### **Vistas:**
- `lista_noticias_analisis()` - Muestra noticias analizables/no analizables
- `ver_resultado_analisis(analisis_id)` - Resultado completo de un análisis
- `mis_analisis()` - Panel con todos los análisis del usuario (paginado)

#### **API Endpoints:**
1. `POST /analisis/api/iniciar/<noticia_id>/`
   - Inicia análisis asincrónico
   - Verifica rol premium
   - Crea `AnalisisNoticia` con estado `en_proceso`
   - Lanza `analizar_noticia_task(noticia_id, user_id)`
   - Devuelve `task_id` para polling

2. `GET /analisis/api/estado/<task_id>/`
   - Devuelve estado de la tarea Celery
   - Progreso, status, resultado si ya acabó

3. `GET /analisis/api/ultimo/<noticia_id>/`
   - Devuelve último análisis completado del usuario actual para esa noticia
   - Resumen, sentimiento, categoría, palabras clave

#### **Tasks (Celery):**
- **`analizar_noticia_task(noticia_id, user_id, max_retries=3)`**
  1. Obtiene la noticia y el AnalisisNoticia record
  2. Actualiza estado a `en_proceso`
  3. Scrapea contenido real de la URL (vuelve a parsear HTML con BeautifulSoup)
  4. Envía a OpenRouter con prompt específico
  5. Parsea JSON devuelto por la IA
  6. Guarda resultados en BD
  7. Reintentos automáticos si hay rate limit (espera 60s)

**Prompt a IA (OpenRouter):**
```
Analiza la noticia y devuelve JSON con:
- resumen: 2-3 párrafos clave
- sentimiento: {label, confianza}
- categoria: Una de Política/Economía/Tecnología/Deportes/Gastronomía/Investigación/Mundo/Lima
- entidades: {PERSON, ORG, LOC}
- palabras_clave: Array de 5 (ordenadas por relevancia)
```

**Selectores HTML para obtener contenido:**
- El Comercio: `div.story-contents__content` o `article`
- Perú21: `div.note__text` o `div.note-content` o fallback genérico

---

## 📊 Flujos Principales

### **Flujo 1: Scraping Automático (cada 5 horas)**

```
Celery Beat (scheduler)
    ↓
beat ejecuta: scraping.tasks.scrape_all_sections
    ↓
Celery Worker
    ↓
run_single_scrape para cada una de las 10 secciones
    ↓
Management Command (ej: scrape_elcomercio)
    ↓
Playwright abre Chrome headless
    ↓
Navega a portada → espera a .fs-wi
    ↓
Scrollea para lazy loading
    ↓
Extrae: título, autor, fecha, imagen, enlace
    ↓
Inserta en BD (get_or_create evita duplicados)
    ↓
Devuelve resultado a Celery Beat
```

### **Flujo 2: Usuario solicita Análisis (Premium)**

```
Usuario hace POST a /analisis/api/iniciar/123/
    ↓
View verifica: usuario es premium/admin
    ↓
Crea AnalisisNoticia(estado='pendiente')
    ↓
Lanza analizar_noticia_task.delay(noticia_id, user_id)
    ↓
Devuelve task_id al frontend
    ↓
Frontend polling: GET /analisis/api/estado/task_id
    ↓
Celery Worker recibe la tarea
    ↓
Scrapea contenido HTML de la noticia
    ↓
Prepara prompt y llama OpenRouter API
    ↓
Parsea JSON (sentimiento, categoría, etc.)
    ↓
Guarda en AnalisisNoticia(estado='completado')
    ↓
Frontend detiene polling y muestra resultado
```

### **Flujo 3: Registro de Actividades**

```
Usuario hace acción (login, vista, búsqueda, compartir, scraping)
    ↓
View llama: registrar_login(), registrar_vista_noticia_actividad(), etc.
    ↓
Crea Actividad(usuario, tipo, descripcion, noticia?, datos_extra?)
    ↓
Se guarda en BD
    ↓
Aparece en profile como historial reciente
```

---

## 🗃️ Esquema de BD

```
users (Django built-in)
├── id, username, email, password, is_staff, is_superuser, etc.

profile
├── id, user_id (FK→users), role, fecha_registro

actividad
├── id, usuario_id (FK→users), tipo, descripcion, 
├── noticia_id (FK→noticia, nullable), datos_extra (JSON), fecha_actividad

noticia
├── id, titulo, autor, fecha, imagen, enlace, origen, fecha_scraping

noticia_vistas
├── id, usuario_id (FK→users), noticia_id (FK→noticia), fecha_vista
├── unique_together: (usuario_id, noticia_id)

analisisnoticia
├── id, noticia_id (FK→noticia), usuario_id (FK→users), 
├── resumen, sentimiento, sentimiento_confianza, categoria,
├── entidades (JSON), palabras_clave (JSON), task_id, estado, 
├── tokens_usados, coste_estimado, creado_en, actualizado_en
├── unique_together: (noticia_id, usuario_id)
```

---

## 🔐 Configuración de Seguridad

**En `settings.py`:**
```python
DEBUG = os.getenv('DEBUG', 'True') == 'True'          # False en producción
SECRET_KEY = os.getenv('SECRET_KEY', '...')          # De .env
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '*').split(',')

# Middleware de seguridad
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    ...
]

# Sesiones (1 hora)
SESSION_COOKIE_AGE = 3600
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Protección: LOGIN_URL redirige a /accounts/login/
@login_required  # Decorador en todas las vistas de noticias/análisis
```

**Control de acceso por rol:**
```python
def check_user_premium(user):
    """Solo usuarios premium/admin pueden iniciar análisis"""
    return user.is_staff or user.profile.role in ['premium', 'admin']

# En vistas:
if not check_user_premium(request.user):
    return JsonResponse({'error': 'permission_denied'}, status=403)
```

---

## 📦 Dependencias Clave con Versiones

| Librería | Versión | Uso |
|----------|---------|-----|
| Django | 5.2.6 | Framework web |
| Celery | 5.5.3 | Tareas asincrónicas |
| Playwright | 1.55.0 | Web scraping (navegador automated) |
| BeautifulSoup4 | 4.13.5 | Parsing HTML |
| openai | 2.8.1 | Cliente OpenRouter (compatible con OpenAI) |
| mysqlclient | 2.2.7 | Driver MySQL |
| redis | 6.4.0 | Cliente Python para Redis |
| requests | 2.32.5 | HTTP requests (para scraping adicional) |
| pydantic | 2.12.4 | Validación de datos |
| python-dotenv | 1.2.1 | Cargar variables .env |
| PyJWT | 2.10.1 | Tokens JWT (si se usa API auth) |

---

## 🚀 Cómo Ejecutar el Proyecto

### **Prerequisitos**
```bash
# 1. Python 3.9+ instalado
# 2. MySQL corriendo (por defecto localhost:3306)
# 3. Redis corriendo (por defecto localhost:6379)
```

### **Instalación y Setup**
```bash
# 1. Crear virtual environment
python -m venv env
source env/Scripts/activate  # Windows: env\Scripts\activate

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Crear archivo .env en raíz del proyecto
cat > .env << EOF
DEBUG=True
SECRET_KEY=tu-secret-key-aqui
DB_ENGINE=django.db.backends.mysql
DB_NAME=elcomercio_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
OPENROUTER_API_KEY=tu-api-key-aqui
OPENROUTER_MODEL=openai/gpt-3.5-turbo
EOF

# 4. Migraciones BD
python manage.py makemigrations
python manage.py migrate

# 5. Crear super usuario
python manage.py createsuperuser

# 6. Recolectar archivos estáticos (producción)
python manage.py collectstatic --noinput
```

### **Ejecutar en Desarrollo**
```bash
# Terminal 1: Django dev server
python manage.py runserver

# Terminal 2: Celery Worker
celery -A web_scraping worker --loglevel=info --pool=solo

# Terminal 3: Celery Beat (tareas programadas)
python manage.py cleaned_beat
# O sin limpieza: celery -A web_scraping beat --loglevel=info

# Acceder a:
# - App: http://localhost:8000
# - Admin: http://localhost:8000/admin
```

### **Ejecutar Scraping Manual**
```bash
# Una sección específica
python manage.py scrape_elcomercio
python manage.py scrape_peru21

# Mediante API (requiere usuario premium en web):
# POST http://localhost:8000/scraping/scraping/lista
# Asincrónico: devuelve task_id de Celery
```

---

## 🐛 Logging

```python
# settings.py configura loggers
LOGGING = {
    'loggers': {
        'analisis': {'level': 'DEBUG', 'handlers': ['file', 'console']},
        'scraping': {'level': 'DEBUG', 'handlers': ['file', 'console']},
    }
}

# Archivos generados:
# - debug.log (archivo local)
# - Salida de Celery por consola
```

---

## ✅ Funcionalidades Implementadas

- ✅ Scraping multi-sección (El Comercio + Perú21)
- ✅ Almacenamiento en BD MySQL
- ✅ Autenticación y perfiles de usuario
- ✅ Roles (normal, premium, admin)
- ✅ Análisis de noticias con OpenRouter (IA)
- ✅ Tareas asincrónicas Celery + Redis
- ✅ Beat scheduler (scraping cada 5 horas)
- ✅ Tracking de actividades de usuarios
- ✅ Planes de suscripción premium (simulado)
- ✅ Búsqueda y filtrado de noticias
- ✅ Paginación
- ✅ Notificaciones de progreso (WebSocket via Celery state)
- ✅ Admin Django personalizado

---

## 🚧 Áreas de Mejora / TODO

1. **Seguridad:**
   - [ ] HTTPS en producción
   - [ ] Rate limiting en endpoints de scraping
   - [ ] Encriptación de API keys en DB

2. **Performance:**
   - [ ] Cache Redis para listados de noticias
   - [ ] Índices DB optimizados
   - [ ] Lazy load en frontend (infinite scroll)

3. **Escalabilidad:**
   - [ ] Dockerización (Dockerfile + docker-compose.yml)
   - [ ] CI/CD pipeline (GitHub Actions)
   - [ ] Deployment a cloud (Heroku, AWS, Azure)

4. **Features nuevas:**
   - [ ] Notificaciones por email (destacadas)
   - [ ] Categorización automática (sin IA)
   - [ ] Exportar análisis (PDF)
   - [ ] Integración redes sociales (compartir)
   - [ ] Dashboard de analítica (para admin)
   - [ ] API REST pública (autenticada)
   - [ ] WebSocket real-time (progress scraping)

5. **Testing:**
   - [ ] Tests unitarios (pytest-django)
   - [ ] Tests de integración
   - [ ] Mocking de Playwright para CI

6. **Documentación:**
   - [ ] API docs (DRF Swagger/OpenAPI)
   - [ ] Runbooks para ops
   - [ ] Architecture diagrams

---

## 📝 Recomendaciones para Actualizar el README

El README actual está **desactualizado**. Se recomienda incluir:

### **Secciones propuestas:**
1. **Descripción general:** Agregador de noticias + IA
2. **Stack técnico:** Django 5.2.6, Celery, Playwright, OpenRouter
3. **Features:**
   - Scraping automático cada 5h
   - Análisis con IA (sentimiento, categoría, entidades)
   - Gestión de usuarios con roles premium
   - Tracking de actividades
4. **Estructura de carpetas:** Diagrama visual
5. **Instalación:** Paso a paso (.env, migraciones, deps)
6. **Uso:**
   - Dev: `python manage.py runserver` + `celery worker` + `beat`
   - Scraping: POST request o `manage.py scrape_*`
   - Análisis: API endpoint premium
7. **BD & Variables de entorno:** .env template
8. **Deploy:** Docker (nuevo), Heroku, etc.
9. **Troubleshooting:** Errores comunes
10. **Licencia y contacto**

---

## 🎓 Conclusión

Este es un **proyecto full-stack profesional** que integra:
- Web scraping (Playwright)
- Processing async (Celery)
- IA generativa (OpenRouter)
- BD relacional (MySQL)
- Autenticación con roles
- Tracking de usuarios

Está **bien arquitecturado** pero tiene **oportunidades de escalabilidad** (Docker, cache, async WebSocket). El código es **limpio y documentado**, aunque le falta **cobertura de tests** y **docs para deploy**.

**Recomendación:** Actualizar README según la plantilla anterior y añadir Dockerfile + docker-compose.yml para facilitar setup local y deploy.

---

*Análisis realizado: 26/11/2025*
*Versiones confirmadas del stack técnico.*
