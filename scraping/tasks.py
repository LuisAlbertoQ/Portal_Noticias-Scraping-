from celery import shared_task
from django.core.management import call_command

@shared_task
def scrape_all_sections():
    call_command('scrape_elcomercio')
    call_command('scrape_economia')
    call_command('scrape_elcomercio_pol')
    call_command('scrape_mundo')
    call_command('scrape_tecnologia')