/**
 * Apollo Error Link - Global Error Handling
 * Arquitectura segura para apps con manejo de dinero
 */

import { ErrorLink } from '@apollo/client/link/error';
import {
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
} from '@apollo/client/errors';
import type { GraphQLError } from 'graphql';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';

/* -------------------------------------------------------------------------- */
/*                                   CODES                                    */
/* -------------------------------------------------------------------------- */

enum ErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN = 'FORBIDDEN',
  VALIDATION_ERROR = 'BAD_USER_INPUT',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

/* -------------------------------------------------------------------------- */
/*                              ERROR UTILITIES                               */
/* -------------------------------------------------------------------------- */

function parseErrorMessage(message: string): string {
  const cleaned = message
    .replace(/^Error:\s*/i, '')
    .replace(/^GraphQL error:\s*/i, '')
    .replace(/^Network error:\s*/i, '');

  const humanized: Record<string, string> = {
    'jwt expired': 'Tu sesión ha expirado. Iniciá sesión nuevamente.',
    'jwt malformed': 'Sesión inválida. Iniciá sesión nuevamente.',
    'invalid token': 'Sesión inválida. Iniciá sesión nuevamente.',
    'not authenticated': 'Debés iniciar sesión para continuar.',
    'validation failed': 'Los datos ingresados no son válidos.',
    'duplicate key': 'Este registro ya existe.',
    'foreign key': 'La operación tiene dependencias activas.',
    'network request failed': 'No se pudo conectar con el servidor.',
  };

  const lower = cleaned.toLowerCase();
  for (const key in humanized) {
    if (lower.includes(key)) return humanized[key];
  }

  return cleaned;
}

/* -------------------------------------------------------------------------- */
/*                              SESSION CONTROL                               */
/* -------------------------------------------------------------------------- */

async function clearSession() {
  if (typeof window === 'undefined') return;

  try {
    // Use Zustand store to clear session (BLOCK 3)
    useAuthStore.getState().logout();
  } catch {
    /* silent */
  }
}

/* -------------------------------------------------------------------------- */
/*                              REDIRECT SAFETY                               */
/* -------------------------------------------------------------------------- */

function redirectToHome() {
  if (typeof window === 'undefined') return;
  
  // Redirect to home instead of login to avoid loops
  // The AuthContext will handle showing the auth UI
  window.location.assign('/');
}

/* -------------------------------------------------------------------------- */
/*                               ERROR LINK                                   */
/* -------------------------------------------------------------------------- */

export const errorLink = new ErrorLink(({ error, operation }) => {
  /* ----------------------------- DEV LOGGING ----------------------------- */
  if (process.env.NODE_ENV === 'development') {
    console.error('[Apollo Error]', {
      operation: operation.operationName,
      error,
    });
  }

  /* ------------------------- GRAPHQL EXECUTION ERRORS ------------------------- */
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach((err: GraphQLError) => {
      const code = err.extensions?.code as ErrorCode | undefined;

      switch (code) {
        case ErrorCode.UNAUTHENTICATED:
          toast.error('Sesión expirada', {
            description: 'Iniciá sesión nuevamente',
          });
          clearSession();
          setTimeout(redirectToHome, 800);
          break;

        case ErrorCode.FORBIDDEN:
          toast.error('Acceso denegado', {
            description: 'No tenés permisos para esta acción',
          });
          break;

        case ErrorCode.VALIDATION_ERROR:
          toast.error('Error de validación', {
            description: parseErrorMessage(err.message),
          });
          break;

        case ErrorCode.NOT_FOUND:
          toast.error('No encontrado', {
            description: 'El recurso solicitado no existe',
          });
          break;

        case ErrorCode.INTERNAL_SERVER_ERROR:
          toast.error('Error del servidor', {
            description: 'Ocurrió un error inesperado',
          });
          break;

        default:
          toast.error('Error', {
            description: parseErrorMessage(err.message),
          });
      }
    });

    return;
  }

  /* ------------------------- GRAPHQL PROTOCOL ERRORS ------------------------- */
  if (CombinedProtocolErrors.is(error)) {
    toast.error('Error de protocolo', {
      description: 'Error inesperado en la comunicación con el servidor',
    });
    return;
  }

  /* ----------------------------- NETWORK ERROR ----------------------------- */
  toast.error('Error de conexión', {
    description: 'No se pudo conectar con el servidor. Verificá tu conexión.',
  });
});
