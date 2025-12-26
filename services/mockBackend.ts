import {
  ServiceRequest,
  JobStatus,
  GeoLocation,
  UserRole,
  UserStatus,
  WorkerTier,
} from '../types';

// Coordenadas de Buenos Aires (centro)
const CENTER_LAT = -34.6037;
const CENTER_LNG = -58.3816;

/**
 * Genera un PIN de 4 dígitos
 */
export const generatePin = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 * @returns distancia en metros
 */
export const calculateDistance = (
  loc1: GeoLocation,
  loc2: GeoLocation
): number => {
  const R = 6371e3; // Radio de la tierra en metros

  const phi1 = (loc1.lat * Math.PI) / 180;
  const phi2 = (loc2.lat * Math.PI) / 180;
  const deltaPhi = ((loc2.lat - loc1.lat) * Math.PI) / 180;
  const deltaLambda = ((loc2.lng - loc1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Formatea montos en ARS
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Algoritmo de matching con penalización por GPS
 */
export const calculateMatchScore = (
  workerLoc: GeoLocation,
  requestLoc: GeoLocation,
  workerRating: number,
  hasGPS: boolean
): number => {
  const distance = calculateDistance(workerLoc, requestLoc);

  // Distancia máxima considerada: 10km
  const distanceScore = Math.max(0, (10000 - distance) / 10000) * 5;

  let score = workerRating * 0.7 + distanceScore * 0.3;

  // Penalización GPS: modo manual reduce prioridad un 50%
  if (!hasGPS) {
    score *= 0.5;
  }

  return score;
};

// -----------------------------------------------------------------------------
// MOCK BACKEND
// -----------------------------------------------------------------------------

/**
 * Simula configuración global de la app
 */
export const fetchAppConfig = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return {
    maintenanceMode: false,
    minVersion: '1.0.0',
    features: {
      aiEstimation: true,
      instantPayouts: false,
    },
  };
};

/**
 * Simula fetch de perfil de usuario según token y rol
 */
export const fetchUserProfile = async (
  token: string,
  role: UserRole
) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Usuario bloqueado
  if (token === 'blocked_token') {
    return {
      id: 'blocked_user',
      name: 'Usuario Bloqueado',
      status: UserStatus.BLOCKED,
    };
  }

  if (role === UserRole.CLIENT) {
    return {
      id: 'c1',
      name: 'Martín (Retornado)',
      rating: 4.8,
      loyaltyPoints: 1250,
      status: UserStatus.LOGGED_IN,
    };
  }

  // Worker
  return {
    id: 'w1',
    name: 'Jorge el Jardinero',
    rating: 4.9,
    totalJobs: 142,
    balance: 15400,
    status: UserStatus.LOGGED_IN,

    // Gamificación
    reputationPoints: 650,
    currentPlan: WorkerTier.PRO,
    acceptanceRate: 0.95,
    cancellationRate: 0.02,
  };
};
