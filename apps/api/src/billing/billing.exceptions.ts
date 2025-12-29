/**
 * Billing Service Exception Handling
 * Professional error messages for fintech-grade reliability
 * Maps internal errors to user-friendly messages
 */

import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

/**
 * Billing-specific exception class
 * Encapsulates error information with descriptive messages
 */
export class BillingException extends BadRequestException {
  constructor(
    public readonly errorCode: string,
    public readonly userMessage: string,
    public readonly internalMessage?: string,
    public readonly statusCode: number = 400,
  ) {
    super({
      statusCode,
      errorCode,
      message: userMessage,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Error codes for different billing scenarios
 * Maps to user-friendly messages
 */
export const BILLING_ERROR_CODES = {
  // Payment errors
  INSUFFICIENT_FUNDS: {
    code: 'PAYMENT_INSUFFICIENT_FUNDS',
    userMessage: 'Fondos insuficientes en tu cuenta o tarjeta. Por favor, verifica tu método de pago.',
    statusCode: 402,
  },
  PAYMENT_METHOD_DECLINED: {
    code: 'PAYMENT_METHOD_DECLINED',
    userMessage: 'Tu método de pago fue rechazado. Intenta con otra tarjeta o cuenta.',
    statusCode: 402,
  },
  PAYMENT_TIMEOUT: {
    code: 'PAYMENT_TIMEOUT',
    userMessage: 'El procesamiento del pago tomó demasiado tiempo. Por favor, intenta nuevamente.',
    statusCode: 504,
  },
  PAYMENT_DUPLICATE: {
    code: 'PAYMENT_DUPLICATE',
    userMessage: 'Este pago ya fue procesado. Si es un error, contacta a nuestro soporte.',
    statusCode: 409,
  },

  // Service errors
  SERVICE_NOT_FOUND: {
    code: 'SERVICE_NOT_FOUND',
    userMessage: 'El servicio solicitado no existe o fue eliminado.',
    statusCode: 404,
  },
  SERVICE_ALREADY_PAID: {
    code: 'SERVICE_ALREADY_PAID',
    userMessage: 'Este servicio ya ha sido pagado. No se pueden procesar múltiples pagos.',
    statusCode: 409,
  },
  SERVICE_INVALID_PRICE: {
    code: 'SERVICE_INVALID_PRICE',
    userMessage: 'El precio del servicio es inválido. Por favor, contacta a soporte.',
    statusCode: 400,
  },

  // Wallet errors
  WALLET_INSUFFICIENT_BALANCE: {
    code: 'WALLET_INSUFFICIENT_BALANCE',
    userMessage: 'No tienes suficiente saldo disponible para esta operación.',
    statusCode: 402,
  },
  WALLET_LOCKED: {
    code: 'WALLET_LOCKED',
    userMessage: 'Tu billetera está bloqueada temporalmente. Intenta más tarde.',
    statusCode: 403,
  },

  // Refund errors
  REFUND_NOT_ELIGIBLE: {
    code: 'REFUND_NOT_ELIGIBLE',
    userMessage: 'Este pago no es elegible para reembolso. Verificar plazo o estado.',
    statusCode: 400,
  },
  REFUND_FAILED: {
    code: 'REFUND_FAILED',
    userMessage: 'El reembolso no se pudo procesar. Por favor, contacta a soporte.',
    statusCode: 500,
  },

  // Authorization errors
  UNAUTHORIZED_PAYMENT: {
    code: 'UNAUTHORIZED_PAYMENT',
    userMessage: 'No tienes autorización para procesar este pago.',
    statusCode: 403,
  },

  // Gateway errors
  GATEWAY_ERROR: {
    code: 'GATEWAY_ERROR',
    userMessage: 'El servicio de pagos no está disponible. Por favor, intenta más tarde.',
    statusCode: 503,
  },
  GATEWAY_TIMEOUT: {
    code: 'GATEWAY_TIMEOUT',
    userMessage: 'La conexión con el servicio de pagos expiró. Reintentando...',
    statusCode: 504,
  },

  // Configuration/system errors
  INVALID_CONFIGURATION: {
    code: 'INVALID_CONFIGURATION',
    userMessage: 'Error de configuración del sistema. Por favor, contacta a soporte.',
    statusCode: 500,
  },
  IDEMPOTENCY_KEY_MISSING: {
    code: 'IDEMPOTENCY_KEY_MISSING',
    userMessage: 'Falta la clave de idempotencia para garantizar no duplicados.',
    statusCode: 400,
  },
};

/**
 * Factory function to throw billing exceptions
 */
export function throwBillingException(
  errorKey: keyof typeof BILLING_ERROR_CODES,
  internalMessage?: string,
): never {
  const errorDef = BILLING_ERROR_CODES[errorKey];
  throw new BillingException(
    errorDef.code,
    errorDef.userMessage,
    internalMessage,
    errorDef.statusCode,
  );
}

/**
 * Safe error handler wrapper
 * Catches unexpected errors and returns safe response
 */
export class SafeErrorHandler {
  static handle(error: any, context: string = 'Billing Operation'): never {
    console.error(`[${context}] Error:`, error);

    // If it's already a BillingException, re-throw it
    if (error instanceof BillingException) {
      throw error;
    }

    // Handle specific error types
    if (error?.code === 'PAYMENT_DUPLICATE_IDEMPOTENT') {
      throwBillingException('PAYMENT_DUPLICATE');
    }

    if (error?.code === 'GATEWAY_TIMEOUT' || error?.code === 'ETIMEDOUT') {
      throwBillingException('PAYMENT_TIMEOUT');
    }

    if (error?.status === 502 || error?.status === 503) {
      throwBillingException('GATEWAY_ERROR', error.message);
    }

    // Default: generic internal error with safe message
    throwBillingException('GATEWAY_ERROR', error.message);
  }
}

/**
 * Logging utility for audit trails
 */
export class PaymentAuditLog {
  static log(
    level: 'info' | 'warn' | 'error',
    action: string,
    details: Record<string, any>,
    sensitiveData?: boolean,
  ): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      action,
      level,
      // Mask sensitive data in logs
      details: sensitiveData ? maskSensitiveData(details) : details,
    };

    // TODO: Send to external logging service (Sentry, DataDog, etc.)
    console.log(`[BILLING_AUDIT] ${JSON.stringify(logEntry)}`);
  }
}

/**
 * Mask sensitive information for safe logging
 */
function maskSensitiveData(data: any): any {
  if (!data) return data;

  const masked = { ...data };
  const sensitiveFields = ['cardNumber', 'cvv', 'password', 'token', 'apiKey'];

  sensitiveFields.forEach((field) => {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  });

  return masked;
}
