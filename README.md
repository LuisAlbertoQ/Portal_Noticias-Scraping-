# Web Scraping Django

Este proyecto realiza scraping de noticias utilizando Django y Playwright.

## Requisitos
- Python 3.13
- pip
- Git

## Instalación

1. Clona el repositorio:
   ```pwsh
   git clone <URL_DEL_REPOSITORIO>
   cd web_Scraping
   ```

2. Crea y activa el entorno virtual:
   ```pwsh
   python -m venv env
   .\env\Scripts\Activate.ps1
   ```

3. Instala las dependencias:
   ```pwsh
   pip install -r requirements.txt
   ```

4. Instala Playwright y sus navegadores:
   ```pwsh
   playwright install
   ```

## Migraciones de la base de datos

Ejecuta las migraciones:
```pwsh
python manage.py migrate
```

## Ejecución del servidor

Inicia el servidor de desarrollo:
```pwsh
python manage.py runserver
```

Accede a la aplicación en: http://127.0.0.1:8000/

## Ejecución de tareas de scraping

Si tienes tareas programadas con Celery:
```pwsh
celery -A web_scraping worker --loglevel=info
```

## Estructura principal
- `scraping/` : App principal para scraping y lógica de negocio
- `web_scraping/` : Configuración del proyecto Django
- `requirements.txt` : Dependencias
- `env/` : Entorno virtual (ignorado por git)

## Notas
- No olvides configurar las variables de entorno si usas base de datos externa o credenciales.
- Revisa el archivo `.gitignore` para evitar subir archivos innecesarios.

## Autor
- Tu nombre aquí
