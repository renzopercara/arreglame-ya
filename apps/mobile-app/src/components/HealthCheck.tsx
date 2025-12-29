'use client';

import { useState, useEffect } from 'react';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client/react';

interface HealthStatus {
  status: 'ok' | 'error';
  message?: string;
  isConnected: boolean;
  isLoading: boolean;
}

// Consulta GraphQL simple para verificar conectividad
const HEALTH_QUERY = gql`
  query HealthCheck {
    healthCheckReputation
  }
`;

export function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus>({
    status: 'error',
    message: 'Verificando conexión...',
    isConnected: false,
    isLoading: true,
  });

  const { data, error, loading, refetch } = useQuery<{ healthCheckReputation: string }>(HEALTH_QUERY, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (loading) return;
    if (error) {
      setHealth({
        status: 'error',
        message: `Error de conexión: ${error.message}`,
        isConnected: false,
        isLoading: false,
      });
      return;
    }
    setHealth({
      status: 'ok',
      message: data?.healthCheckReputation || 'Conexión exitosa',
      isConnected: true,
      isLoading: false,
    });
  }, [data, error, loading]);

  useEffect(() => {
    const interval = setInterval(() => refetch(), 5000);
    return () => clearInterval(interval);
  }, [refetch]);

  const bgColor = health.isConnected
    ? 'bg-green-50 border-green-200'
    : 'bg-red-50 border-red-200';
  const textColor = health.isConnected ? 'text-green-800' : 'text-red-800';
  const statusColor = health.isConnected
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';

  return (
    <div
      className={`rounded-lg border p-6 ${bgColor} transition-all duration-300`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0">
          {health.isLoading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
          ) : health.isConnected ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-200">
              <svg
                className="h-5 w-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-200">
              <svg
                className="h-5 w-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <h3 className={`font-semibold ${textColor}`}>
            {health.isConnected ? 'API Conectada' : 'API No disponible'}
          </h3>
          <p className={`text-sm ${textColor} opacity-75`}>{health.message}</p>
        </div>
        <div>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusColor}`}
          >
            {health.isLoading ? 'Verificando...' : health.isConnected ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>
    </div>
  );
}
