from celery import shared_task
from django.core.management import call_command
import time
import subprocess
import sys
import threading
import queue
import os
import re
from celery.exceptions import TimeoutError

@shared_task
def scrape_all_sections():
    """Tarea para ejecutar todos los scrapers (sin progreso individual)"""
    call_command('scrape_elcomercio')
    call_command('scrape_economia') 
    call_command('scrape_elcomercio_pol')
    call_command('scrape_mundo')
    call_command('scrape_tecnologia')
    call_command('scrape_peru21')
    call_command('scrape_peru21D')
    call_command('scrape_peru21G')
    call_command('scrape_peru21I')
    call_command('scrape_peru21L')

@shared_task(bind=True)
def run_single_scrape(self, command_name):
    """Versión MEJORADA con progreso REAL basado en noticias procesadas."""
    try:
        # Configuración MEJORADA con progreso por noticias
        command_config = {
            'scrape_elcomercio': {
                'timeout': 900,
                'estimated_articles': 80,
                'phases': [
                    (5, "🔄 Iniciando scraping El Comercio..."),
                    (15, "🌐 Navegando a portada principal..."),
                    (25, "📜 Cargando secciones..."),
                    (40, "📄 Extrayendo noticias..."),
                    (85, "💾 Guardando en base de datos..."),
                    (95, "📊 Generando reporte..."),
                    (100, "✅ Scraping El Comercio completado!")
                ]
            },
            'scrape_economia': {
                'timeout': 480,
                'estimated_articles': 25,
                'phases': [
                    (5, "🔄 Iniciando scraping Economía..."),
                    (20, "🌐 Accediendo a sección económica..."),
                    (35, "📜 Cargando datos financieros..."),
                    (50, "📄 Procesando noticias económicas..."),
                    (85, "💾 Guardando información..."),
                    (95, "📊 Finalizando..."),
                    (100, "✅ Scraping Economía completado!")
                ]
            },
            'scrape_elcomercio_pol': {
                'timeout': 480,
                'estimated_articles': 25,
                'phases': [
                    (5, "🔄 Iniciando scraping Política..."),
                    (20, "🌐 Accediendo a sección política..."),
                    (35, "📜 Cargando noticias políticas..."),
                    (50, "📄 Procesando contenido..."),
                    (85, "💾 Guardando datos..."),
                    (95, "📊 Finalizando..."),
                    (100, "✅ Scraping Política completado!")
                ]
            },
            'scrape_mundo': {
                'timeout': 480,
                'estimated_articles': 25,
                'phases': [
                    (5, "🔄 Iniciando scraping Mundo..."),
                    (20, "🌐 Accediendo a noticias internacionales..."),
                    (35, "📜 Cargando noticias globales..."),
                    (50, "📄 Procesando información..."),
                    (85, "💾 Guardando datos..."),
                    (95, "📊 Finalizando..."),
                    (100, "✅ Scraping Mundo completado!")
                ]
            },
            'scrape_tecnologia': {
                'timeout': 480,
                'estimated_articles': 25,
                'phases': [
                    (5, "🔄 Iniciando scraping Tecnología..."),
                    (20, "🌐 Accediendo a sección tecnológica..."),
                    (35, "📜 Cargando noticias de tech..."),
                    (50, "📄 Procesando innovaciones..."),
                    (85, "💾 Guardando datos..."),
                    (95, "📊 Finalizando..."),
                    (100, "✅ Scraping Tecnología completado!")
                ]
            },
            'scrape_peru21': {
                'timeout': 1800,
                'estimated_articles': 50,
                'phases': [
                    (5, "🔄 Iniciando scraping Peru21..."),
                    (15, "🌐 Navegando a portada..."),
                    (25, "📜 Cargando noticias..."),
                    (40, "📄 Procesando noticias..."),
                    (85, "💾 Guardando en base de datos..."),
                    (95, "📊 Generando reporte..."),
                    (100, "✅ Scraping Peru21 completado!")
                ]
            },
            'scrape_peru21D': {
                'timeout': 1800,
                'estimated_articles': 30,
                'phases': [
                    (5, "🔄 Iniciando scraping Deportes..."),
                    (15, "🌐 Navegando a sección deportiva..."),
                    (25, "📜 Cargando noticias deportivas..."),
                    (40, "📄 Procesando resultados..."),
                    (85, "💾 Guardando datos..."),
                    (95, "📊 Generando reporte..."),
                    (100, "✅ Scraping Deportes completado!")
                ]
            },
            'scrape_peru21G': {
                'timeout': 1800,
                'estimated_articles': 25,
                'phases': [
                    (5, "🔄 Iniciando scraping Gastronomía..."),
                    (15, "🌐 Navegando a sección gastronómica..."),
                    (25, "📜 Cargando recetas y noticias..."),
                    (40, "📄 Procesando contenido..."),
                    (85, "💾 Guardando datos..."),
                    (95, "📊 Generando reporte..."),
                    (100, "✅ Scraping Gastronomía completado!")
                ]
            },
            'scrape_peru21I': {
                'timeout': 1800,
                'estimated_articles': 20,
                'phases': [
                    (5, "🔄 Iniciando scraping Investigación..."),
                    (15, "🌐 Navegando a reportajes..."),
                    (25, "📜 Cargando investigaciones..."),
                    (40, "📄 Procesando datos..."),
                    (85, "💾 Guardando información..."),
                    (95, "📊 Generando reporte..."),
                    (100, "✅ Scraping Investigación completado!")
                ]
            },
            'scrape_peru21L': {
                'timeout': 1800,
                'estimated_articles': 30,
                'phases': [
                    (5, "🔄 Iniciando scraping Lima..."),
                    (15, "🌐 Navegando a sección Lima..."),
                    (25, "📜 Cargando noticias locales..."),
                    (40, "📄 Procesando noticias de Lima..."),
                    (85, "💾 Guardando en base de datos..."),
                    (95, "📊 Generando reporte..."),
                    (100, "✅ Scraping Lima completado!")
                ]
            },
        }
        
        # Obtener configuración para este comando o usar valores por defecto
        config = command_config.get(command_name, {
            'timeout': 600,
            'estimated_articles': 20,
            'phases': [
                (5, "🔄 Preparando scraping..."),
                (25, "🌐 Navegando..."),
                (40, "📄 Procesando contenido..."),
                (70, "💾 Guardando datos..."),
                (90, "📊 Finalizando..."),
                (100, "✅ Scraping completado")
            ]
        })
        
        timeout = config['timeout']
        estimated_articles = config['estimated_articles']
        phases = config['phases']
        
        start_time = time.time()
        current_phase_index = 0
        
        print(f"🎯 Iniciando {command_name} (timeout: {timeout}s, estimado: {estimated_articles} noticias)")
        
        # FASE 1: Inicio
        self.update_state(
            state='PROGRESS',
            meta={
                'current': phases[0][0],
                'total': 100,
                'status': phases[0][1],
                'command': command_name,
                'estimated_articles': estimated_articles,
                'articles_processed': 0,
                'total_articles_found': 0,
                'phase': 'starting'
            }
        )
        time.sleep(1)
        
        # Configurar entorno UTF-8
        env = os.environ.copy()
        env['PYTHONIOENCODING'] = 'utf-8'
        
        creation_flags = 0
        if sys.platform == 'win32':
            creation_flags = subprocess.CREATE_NO_WINDOW
        
        # Función del hilo lector
        def _reader_thread(pipe, output_queue):
            """Hilo que lee la salida del proceso sin bloquear"""
            try:
                for line in iter(pipe.readline, ''):
                    if line:
                        output_queue.put(line.strip())
            finally:
                output_queue.put(None)  # Señal de fin
                pipe.close()
        
        # Iniciar proceso con buffer line-buffered
        process = subprocess.Popen(
            [sys.executable, 'manage.py', command_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            env=env,
            encoding='utf-8',
            errors='replace',
            bufsize=1,  # CRÍTICO: Line-buffered
            creationflags=creation_flags
        )
        
        # Configurar hilo de lectura
        output_queue = queue.Queue()
        reader_thread = threading.Thread(target=_reader_thread, args=(process.stdout, output_queue))
        reader_thread.daemon = True
        reader_thread.start()
        
        print(f"🔄 Comando {command_name} ejecutándose (PID: {process.pid})")
        
        # Variables de seguimiento
        articles_processed = 0
        total_articles_found = 0
        last_articles_count = 0
        processing_started = False
        
        def update_progress():
            """Actualizar progreso basado en noticias procesadas"""
            nonlocal current_phase_index
            
            current_progress = phases[current_phase_index][0]
            current_status = phases[current_phase_index][1]
            
            # PROGRESO REAL BASADO EN NOTICIAS
            if processing_started and total_articles_found > 0:
                if articles_processed > 0:
                    article_ratio = articles_processed / total_articles_found
                    article_progress = 40 + (article_ratio * 45)  # 40% a 85%
                    current_progress = min(85, int(article_progress))
                    current_status = f"📄 Procesando noticias ({articles_processed}/{total_articles_found})"
                
                if articles_processed >= total_articles_found and total_articles_found > 0:
                    if current_phase_index < 4:
                        current_phase_index = 4
            
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': current_progress,
                    'total': 100,
                    'status': current_status,
                    'command': command_name,
                    'articles_processed': articles_processed,
                    'total_articles_found': total_articles_found,
                    'elapsed_time': int(time.time() - start_time),
                    'timeout': timeout,
                    'phase': f'phase_{current_phase_index + 1}'
                }
            )
            
            if articles_processed != last_articles_count:
                print(f"📊 Progreso: {current_progress}% - {current_status} "
                      f"(Noticias: {articles_processed}/{total_articles_found})")
        
        last_progress_update = time.time()
        
        # Bucle principal de monitoreo (SIMPLIFICADO - SIN select)
        while True:
            elapsed = time.time() - start_time
            time_limit = timeout + 60
            
            # Timeout con margen de seguridad
            if elapsed > time_limit:
                print(f"⏰ Timeout alcanzado: {elapsed}s > {time_limit}s")
                process.kill()
                reader_thread.join(timeout=2)
                raise TimeoutError(f"Tiempo límite excedido: {time_limit}s")
            
            # LEER OUTPUT SOLO DEL HILO (sin bloquear)
            try:
                line = output_queue.get_nowait()
                if line is None:  # Fin del stream
                    break
                    
                print(f"📝 {command_name}: {line}")
                
                # DETECTAR EVENTOS (regex mejorados)
                if "Se encontraron" in line and "noticias" in line:
                    match = re.search(r'Se encontraron\s+(\d+)\s+noticias', line)
                    if match:
                        total_articles_found = int(match.group(1))
                        processing_started = True
                        print(f"🎯 Total de noticias detectadas: {total_articles_found}")
                
                elif "Procesando noticia" in line:
                    match = re.search(r'noticia\s+(\d+)/(\d+)', line)
                    if match:
                        articles_processed = int(match.group(1))
                        total_num = int(match.group(2))
                        if total_num > total_articles_found:
                            total_articles_found = total_num
                        print(f"📄 Noticia procesada: {articles_processed}/{total_articles_found}")
                        
            except queue.Empty:
                # No hay datos, verificar si el proceso terminó
                if process.poll() is not None and output_queue.empty():
                    break
            
            # Actualizar progreso cada 3 segundos o cuando hay cambio
            if (time.time() - last_progress_update > 3 or 
                articles_processed != last_articles_count):
                update_progress()
                last_progress_update = time.time()
                last_articles_count = articles_processed
            
            time.sleep(0.1)
        
        # Esperar a que el hilo de lectura termine
        reader_thread.join(timeout=5)
        return_code = process.poll()
        
        if return_code == 0:
            success_message = (f"✅ {command_name} completado! "
                             f"{articles_processed} noticias procesadas en {int(time.time() - start_time)}s")
            
            self.update_state(
                state='PROGRESS',
                meta={
                    'current': 100,
                    'total': 100,
                    'status': success_message,
                    'command': command_name,
                    'articles_processed': articles_processed,
                    'total_articles_found': total_articles_found,
                    'completed': True,
                    'elapsed_time': int(time.time() - start_time),
                    'success': True
                }
            )
            
            print(f"🎉 {command_name} EXITOSO: {articles_processed} noticias en {int(time.time() - start_time)}s")
            
            return {
                "status": "success",
                "message": success_message,
                "command": command_name,
                "articles_processed": articles_processed,
                "total_articles_found": total_articles_found,
                "elapsed_time": int(time.time() - start_time),
                "completed": True
            }
        else:
            error_msg = f"El comando falló con código: {return_code}"
            print(f"💥 {error_msg}")
            
            self.update_state(
                state='FAILURE',
                meta={
                    'current': 0,
                    'total': 100,
                    'status': error_msg,
                    'command': command_name,
                    'error': error_msg,
                    'articles_processed': articles_processed,
                    'return_code': return_code
                }
            )
            
            raise Exception(error_msg)
        
    except TimeoutError as exc:
        error_msg = f"Timeout después de {timeout}s: {exc}"
        print(f"⏰ {error_msg}")
        
        self.update_state(
            state='FAILURE',
            meta={
                'current': 0,
                'total': 100,
                'status': error_msg,
                'command': command_name,
                'error': str(exc),
                'timeout': True,
                'articles_processed': articles_processed if 'articles_processed' in locals() else 0
            }
        )
        raise
        
    except Exception as exc:
        error_msg = f"Error crítico: {exc}"
        print(f"💥 {error_msg}")
        
        self.update_state(
            state='FAILURE',
            meta={
                'current': 0,
                'total': 100,
                'status': error_msg,
                'command': command_name,
                'error': str(exc),
                'articles_processed': articles_processed if 'articles_processed' in locals() else 0
            }
        )
        raise