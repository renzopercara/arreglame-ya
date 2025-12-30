/**
 * Apollo Error Link - Global Error Handling
 * 
 * Maneja todos los errores de GraphQL y Network de forma centralizada
 * siguiendo los principios de UX mobile-first y seguridad financiera
 */

import { onError } from '@apollo/client/link/error';
import { toast } from 'sonner';

/**
 * Error codes que manejamos específicamente
 */
enum ErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'BAD_USER_INPUT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

/**
 * Normaliza mensajes de error técnicos a lenguaje humano
 */
function parseErrorMessage(message: string): string {
  // Remove technical prefixes
  const cleaned = message
    .replace(/^Error:\s*/i, '')
    .replace(/^GraphQL error:\s*/i, '')
    .replace(/^Network error:\s*/i, '');

  // Common patterns to humanize
  const humanizedPatterns: Record<string, string> = {
    'jwt expired': 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    'jwt malformed': 'Tu sesión es inválida. Por favor, inicia sesión nuevamente.',
    'invalid token': 'Tu sesión es inválida. Por favor, inicia sesión nuevamente.',
    'not authenticated': 'Debes iniciar sesión para realizar esta acción.',
    'validation failed': 'Los datos ingresados no son válidos.',
    'duplicate key': 'Este registro ya existe.',
    'foreign key': 'No se puede realizar esta operación debido a dependencias.',
    'network request failed': 'No se pudo conectar con el servidor. Verifica tu conexión.',
  };

  const lowerMessage = cleaned.toLowerCase();
  for (const [pattern, humanMessage] of Object.entries(humanizedPatterns)) {
    if (lowerMessage.includes(pattern)) {
      return humanMessage;
    }
  }

  return cleaned;
}

/**
 * Limpia la sesión del usuario
 */
function clearSession() {
  try {
    // Clear only auth-related storage to avoid affecting other app functionality
    if (typeof window !== 'undefined') {
      // Clear specific auth keys
      localStorage.removeItem('ay_auth_token');
      localStorage.removeItem('ay_user_id');
      localStorage.removeItem('ay_user_role');
      
      // Clear session storage auth keys
      sessionStorage.removeItem('ay_auth_token');
      sessionStorage.removeItem('ay_user_id');
    }
  } catch (error) {
    console.error('Error clearing session:', error);
  }
}

/**
 * Allowed paths for redirect (whitelist to prevent open redirect attacks)
 */
const ALLOWED_REDIRECT_PATHS = [
  '/',
  '/dashboard',
  '/profile',
  '/jobs',
  '/wallet',
  '/history',
  '/settings',
];

/**
 * Validates if a path is allowed for redirect
 */
function isAllowedRedirectPath(path: string): boolean {
  return ALLOWED_REDIRECT_PATHS.some(allowed => 
    path === allowed || path.startsWith(allowed + '/')
  );
}

/**
 * Redirige a login
 */
function redirectToLogin() {
  if (typeof window !== 'undefined') {
    // Save current path for redirect after login (with validation)
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/' && isAllowedRedirectPath(currentPath)) {
      sessionStorage.setItem('redirectAfterLogin', currentPath);
    }
    
    window.location.href = '/login';
  }
}

/**
 * Apollo Error Link con manejo completo de errores
 */
export const errorLink = onError(({ graphQLErrors, networkError, operation, forward }) => {
  // Log errors for debugging (only in development)
  if (process.env.NODE_ENV === 'development') {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `[GraphQL Error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
          extensions
        );
      });
    }
    if (networkError) {
      console.error(`[Network Error]: ${networkError}`, {
        operation: operation.operationName,
      });
    }
  }

  // Handle GraphQL Errors
  if (graphQLErrors) {
    for (const error of graphQLErrors) {
      const errorCode = error.extensions?.code as string;
      const message = error.message;

      switch (errorCode) {
        case ErrorCode.UNAUTHENTICATED:
          // Usuario no autenticado o token expirado
          toast.error('Sesión expirada', {
            description: 'Por favor, inicia sesión nuevamente',
            duration: 5000,
          });
          clearSession();
          setTimeout(() => redirectToLogin(), 1000);
          break;

        case ErrorCode.FORBIDDEN:
          // Usuario no tiene permisos
          toast.error('Acceso denegado', {
            description: 'No tienes permisos para realizar esta acción',
            duration: 5000,
          });
          break;

        case ErrorCode.VALIDATION_ERROR:
          // Error de validación de datos
          const humanMessage = parseErrorMessage(message);
          toast.error('Error de validación', {
            description: humanMessage,
            duration: 5000,
          });
          break;

        case ErrorCode.NOT_FOUND:
          // Recurso no encontrado
          toast.error('No encontrado', {
            description: 'El recurso solicitado no existe',
            duration: 4000,
          });
          break;

        case ErrorCode.INTERNAL_SERVER_ERROR:
          // Error interno del servidor
          toast.error('Error del servidor', {
            description: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
            duration: 5000,
          });
          break;

        default:
          // Error desconocido - mostrar mensaje humanizado
          const parsedMessage = parseErrorMessage(message);
          toast.error('Error', {
            description: parsedMessage,
            duration: 5000,
          });
      }
    }
  }

  // Handle Network Errors
  if (networkError) {
    // Check if it's a connection error
    if ('statusCode' in networkError) {
      const statusCode = (networkError as any).statusCode;
      
      switch (statusCode) {
        case 401:
          toast.error('Sesión expirada', {
            description: 'Por favor, inicia sesión nuevamente',
            duration: 5000,
          });
          clearSession();
          setTimeout(() => redirectToLogin(), 1000);
          break;
          
        case 403:
          toast.error('Acceso denegado', {
            description: 'No tienes permisos para esta operación',
            duration: 5000,
          });
          break;
          
        case 500:
        case 502:
        case 503:
          toast.error('Servidor no disponible', {
            description: 'El servidor está experimentando problemas. Intenta nuevamente en unos momentos.',
            duration: 6000,
          });
          break;
          
        default:
          toast.error('Error de conexión', {
            description: `No se pudo conectar con el servidor (${statusCode})`,
            duration: 5000,
          });
      }
    } else {
      // Generic network error (no internet, server down, etc.)
      toast.error('Sin conexión', {
        description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
        duration: 6000,
      });
    }
  }
});
