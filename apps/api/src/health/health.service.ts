import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  check() {
    return {
      status: 'ok',
      message: 'Servidor operativo',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      graphql: {
        endpoint: '/graphql',
        available: true,
      },
      version: '1.0.0',
    };
  }
}
