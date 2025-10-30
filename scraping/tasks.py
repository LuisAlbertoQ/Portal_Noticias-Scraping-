from celery import shared_task
from django.core.management import call_command
import time
import subprocess
import sys
import select
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
                'timeout': 600,  # 10 minutos
                'estimated_articles': 40,
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
                'timeout': 480,  # 8 minutos
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
                'timeout': 480,  # 8 minutos
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
                'timeout': 480,  # 8 minutos
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
                'timeout': 480,  # 8 minutos
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
                'timeout': 1800,  # 30 minutos (basado en tus tiempos reales)
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
                'timeout': 1800,  # 30 minutos
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
                'timeout': 1800,  # 30 minutos
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
                'timeout': 1800,  # 30 minutos
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
                'timeout': 1800,  # 30 minutos
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
        
        # Ejecutar comando y capturar output en tiempo real
        process = subprocess.Popen(
            [sys.executable, 'manage.py', command_name],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Variables para tracking de progreso REAL
        articles_processed = 0
        total_articles_found = 0
        last_articles_count = 0
        processing_started = False
        
        print(f"🔄 Comando {command_name} ejecutándose (PID: {process.pid})")
        
        # FASE 2: Monitoreo INTELIGENTE con lectura de output
        check_interval = 3  # Segundos entre checks
        
        def update_progress(force_update=False):
            """Actualizar progreso basado en noticias procesadas"""
            nonlocal current_phase_index
            
            current_progress = phases[current_phase_index][0]
            current_status = phases[current_phase_index][1]
            
            # PROGRESO REAL BASADO EN NOTICIAS
            if processing_started and total_articles_found > 0:
                if articles_processed > 0:
                    # Calcular progreso entre 40% y 85% basado en noticias
                    article_ratio = articles_processed / total_articles_found
                    article_progress = 40 + (article_ratio * 45)  # 40% a 85%
                    current_progress = min(85, int(article_progress))
                    current_status = f"📄 Procesando noticias ({articles_processed}/{total_articles_found})"
                
                # Avanzar a fase de guardado si se procesaron todas las noticias
                if articles_processed >= total_articles_found and total_articles_found > 0:
                    if current_phase_index < 4:
                        current_phase_index = 4  # Fase de guardado
                        current_progress, current_status = phases[current_phase_index]
            
            # Actualizar estado
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
            
            # Log solo si hay cambio significativo
            if force_update or articles_processed != last_articles_count:
                print(f"📊 Progreso: {current_progress}% - {current_status} "
                      f"(Noticias: {articles_processed}/{total_articles_found})")
        
        # Bucle principal de monitoreo
        last_progress_update = time.time()
        
        while process.poll() is None:  # Mientras el proceso esté activo
            elapsed = time.time() - start_time
            
            # 1. PROTECCIÓN POR TIMEOUT TOTAL
            if elapsed > timeout:
                print(f"⏰ Timeout alcanzado después de {timeout}s")
                process.terminate()
                try:
                    process.wait(timeout=10)  # Esperar 10s para terminación graceful
                except subprocess.TimeoutExpired:
                    process.kill()  # Forzar terminación
                raise TimeoutError(f"El comando {command_name} excedió el tiempo límite de {timeout} segundos")
            
            # 2. LEER OUTPUT EN TIEMPO REAL
            try:
                ready, _, _ = select.select([process.stdout], [], [], 0.5)
                if ready:
                    line = process.stdout.readline()
                    if line:
                        line = line.strip()
                        print(f"📝 {command_name}: {line}")
                        
                        # DETECTAR EVENTOS IMPORTANTES EN EL OUTPUT - VERSIÓN MEJORADA
                        
                        # Detectar "📰 Se encontraron X noticias..."
                        if "📰 Se encontraron" in line and "noticias" in line:
                            match = re.search(r'Se encontraron\s*(\d+)\s*noticias', line)
                            if match:
                                total_articles_found = int(match.group(1))
                                print(f"🎯 Total de noticias detectadas: {total_articles_found}")
                                processing_started = True
                                if current_phase_index < 3:
                                    current_phase_index = 3  # Fase de procesamiento
                        
                        # Detectar "📄 Procesando noticia X/Y"
                        elif "📄 Procesando noticia" in line:
                            # Extraer números: "Procesando noticia 5/17"
                            match = re.search(r'noticia\s*(\d+)/(\d+)', line)
                            if match:
                                current_num = int(match.group(1))
                                total_num = int(match.group(2))
                                articles_processed = current_num
                                
                                # Actualizar total si es mayor
                                if total_num > total_articles_found:
                                    total_articles_found = total_num
                                
                                print(f"📄 Noticia procesada: {articles_processed}/{total_articles_found}")
                        
                        # Detectar "💾 Guardando X noticias..."
                        elif "💾 Guardando" in line and "noticias" in line:
                            if current_phase_index < 4:
                                current_phase_index = 4  # Fase de guardado
                                print("💾 Detectada fase de guardado")
                        
                        # Detectar "✅ Scraping de ... finalizado!"
                        elif "✅ Scraping" in line and "finalizado" in line:
                            if current_phase_index < len(phases) - 1:
                                current_phase_index = len(phases) - 2
                                print("✅ Detectada finalización")
                        
                        # DETECCIÓN ALTERNATIVA (por si falla la anterior)
                        elif ("noticias" in line.lower() and 
                            any(word in line.lower() for word in ["encontraron", "encontradas", "total"])):
                            match = re.search(r'(\d+)\s*noticias', line)
                            if match:
                                total_articles_found = int(match.group(1))
                                print(f"🎯 Total de noticias detectadas (alt): {total_articles_found}")
                                processing_started = True
                                if current_phase_index < 3:
                                    current_phase_index = 3
                        
                        elif "procesando noticia" in line.lower():
                            articles_processed += 1
                            print(f"📄 Noticia procesada (alt): {articles_processed}")
                                
            except (IOError, ValueError) as e:
                print(f"⚠️ Error leyendo output: {e}")
                # Continuar a pesar del error de lectura
            
            # 3. AVANZAR FASES POR TIEMPO (fallback)
            if not processing_started and current_phase_index < 3:
                if elapsed > (timeout * 0.2):  # 20% del tiempo
                    current_phase_index = 1  # Navegación
                if elapsed > (timeout * 0.4):  # 40% del tiempo
                    current_phase_index = 2  # Carga
                if elapsed > (timeout * 0.6):  # 60% del tiempo
                    current_phase_index = 3  # Procesamiento
                    processing_started = True
            
            elif processing_started and current_phase_index < 4:
                if elapsed > (timeout * 0.8):  # 80% del tiempo
                    current_phase_index = 4  # Guardado
            
            # 4. ACTUALIZAR PROGRESO (cada 3 segundos o cuando hay cambio)
            if (time.time() - last_progress_update > 3 or 
                articles_processed != last_articles_count):
                update_progress()
                last_progress_update = time.time()
                last_articles_count = articles_processed
            
            time.sleep(0.5)  # Pequeña pausa para no sobrecargar
        
        # FASE 3: FINALIZACIÓN
        return_code = process.poll()
        final_elapsed = int(time.time() - start_time)
        
        if return_code == 0:
            # ✅ ÉXITO - Completar al 100%
            success_message = (f"✅ {command_name} completado! "
                             f"{articles_processed} noticias procesadas en {final_elapsed}s")
            
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
                    'elapsed_time': final_elapsed,
                    'success': True
                }
            )
            
            print(f"🎉 {command_name} EXITOSO: {articles_processed} noticias en {final_elapsed}s")
            
            return {
                "status": "success",
                "message": success_message,
                "command": command_name,
                "articles_processed": articles_processed,
                "total_articles_found": total_articles_found,
                "elapsed_time": final_elapsed,
                "completed": True
            }
            
        else:
            # ❌ ERROR en el comando
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
        # ⏰ TIMEOUT
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
        # 💥 ERROR GENERAL
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