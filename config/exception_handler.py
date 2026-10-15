from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError

def custom_exception_handler(exc, context):
    """
    Manejador global de excepciones para Django REST Framework.
    Captura excepciones de validación de Django (como las arrojadas por full_clean en los modelos)
    y las transforma en respuestas HTTP 400 comprensibles para el usuario,
    evitando que se generen errores 500 no capturados.
    """
    if isinstance(exc, DjangoValidationError):
        if hasattr(exc, 'message_dict'):
            detail = exc.message_dict
        elif hasattr(exc, 'messages'):
            detail = exc.messages
        else:
            detail = str(exc)
        return Response(detail, status=status.HTTP_400_BAD_REQUEST)

    # Llamar al manejador por defecto de DRF para el resto de excepciones
    response = exception_handler(exc, context)
    return response
