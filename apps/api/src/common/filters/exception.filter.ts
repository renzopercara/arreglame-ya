import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { GqlArgumentsHost, GqlExceptionFilter } from '@nestjs/graphql';
import { Response } from 'express';

/**
 * Global HTTP Exception Filter
 * 
 * Catches all HTTP exceptions and provides consistent error responses
 * with proper logging
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
    };

    // Log the error
    this.logger.error(
      `HTTP ${status} Error: ${request.method} ${request.url}`,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }
}

/**
 * Global GraphQL Exception Filter
 * 
 * Catches all GraphQL exceptions and provides consistent error responses
 * with proper logging while preserving GraphQL error format
 */
@Catch()
export class GraphQLExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphQLExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const gqlHost = GqlArgumentsHost.create(host);
    const info = gqlHost.getInfo();
    const context = gqlHost.getContext();

    // Extract useful information
    const fieldName = info?.fieldName;
    const parentType = info?.parentType?.name;
    const path = info?.path;

    // Log the error with GraphQL context
    this.logger.error(
      `GraphQL Error in ${parentType}.${fieldName}:`,
      {
        message: exception.message,
        path: path,
        operation: context?.req?.body?.operationName,
        variables: context?.req?.body?.variables,
      },
      exception.stack,
    );

    // Return the error in GraphQL format
    return exception;
  }
}

/**
 * All Exceptions Filter
 * 
 * Catches any unhandled exceptions as a last resort
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof Error
        ? exception.message
        : 'Internal server error';

    // Log the error
    this.logger.error(
      `Unhandled Exception: ${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    // Return error response
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : message,
    });
  }
}
