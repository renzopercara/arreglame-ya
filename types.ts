
export enum UserRole {
  CLIENT = 'CLIENT',
  WORKER = 'WORKER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  ANON = 'ANON',
  LOGGED_IN = 'LOGGED_IN',
  BLOCKED = 'BLOCKED',
  DEBTOR = 'DEBTOR'
}

export enum WorkerStatus {
  ONLINE = 'ONLINE',
  PAUSED = 'PAUSED',
  OFFLINE = 'OFFLINE',
  ON_JOB = 'ON_JOB'
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  CREATED = 'CREATED',
  ACCEPTED = 'ACCEPTED', // Added missing status
  EXPIRED = 'EXPIRED',           // Nadie aceptÃƒÂ³ el pedido a tiempo
  SEARCHING_WORKER = 'SEARCHING_WORKER',
  ASSIGNED = 'ASSIGNED',
  NO_SHOW = 'NO_SHOW',           // Trabajador nunca llegÃƒÂ³
  FAILED_START = 'FAILED_START', // Cliente ausente o problema con PIN
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_CLIENT_APPROVAL = 'PENDING_CLIENT_APPROVAL',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED'
}

export enum ResolutionType {
  FULL_REFUND = 'FULL_REFUND',
  PARTIAL_REFUND = 'PARTIAL_REFUND',
  FULL_PAYMENT = 'FULL_PAYMENT',
  WORKER_REDO = 'WORKER_REDO'
}

export enum ExtraTimeStatus {
    NONE = 'NONE',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export enum GPSStatus {
  UNKNOWN = 'UNKNOWN',
  GRANTED = 'GRANTED',
  DENIED = 'DENIED',
  MANUAL = 'MANUAL'
}

export enum WorkerTier {
  STARTER = 'STARTER',
  PRO = 'PRO',
  ELITE = 'ELITE'
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface PriceBreakdown {
  total: number;
  workerNet: number;
  platformFee: number;
  taxes: number;
  currency?: string;
  calculationSnapshot?: any;
}

export interface DisputeInfo {
    id: string;
    reason: string;
    createdAt: number;
    resolvedAt?: number;
    resolution?: ResolutionType;
    resolutionComment?: string;
    aiAuditScore?: number; // 0-100% probabilidad de que el trabajo estÃƒÂ© bien hecho
    deciderRole?: UserRole; // ADMIN o SYSTEM
}

export interface ServiceRequest {
  id: string;
  clientId: string;
  workerId?: string;
  status: JobStatus;
  location: GeoLocation;
  description: string;
  gardenImageBefore: string;
  gardenImageAfter?: string;
  difficulty: number;
  estimatedHours: number;
  price: PriceBreakdown;
  createdAt: number;
  autoCompleteAt?: number; // 24hs despuÃƒÂ©s del fin si el cliente no confirma
  pin?: string;
  clientName?: string;
  workerName?: string;
  squareMeters?: number;
  hasHighWeeds?: boolean;
  extraTimeMinutes?: number;
  extraTimeStatus?: ExtraTimeStatus;
  extraTimeReason?: string;
  dispute?: DisputeInfo;
}

export interface AppNotification {
  id: string;
  toUserId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

// Added missing ChatMessage type
export interface ChatMessage {
    id: string;
    jobId: string;
    senderId: string;
    senderRole: UserRole;
    content: string;
    timestamp: number;
}

// Added missing WorkerProfile type
export interface WorkerProfile {
  id: string;
  name: string;
  rating: number;
  totalJobs: number;
  status: WorkerStatus;
  balance: number;
  location: GeoLocation;
  reputationPoints: number;
  currentPlan: WorkerTier;
  consecutiveRejections?: number;
  acceptanceRate?: number;
  cancellationRate?: number;
}

// Added missing AppState type
export interface AppState {
  currentUserRole: UserRole;
  currentClient: any;
  currentWorker: any;
  requests: ServiceRequest[];
  notifications: AppNotification[];
  gpsStatus: GPSStatus;
  showForcedTerms: boolean;
}

// Added missing SystemConfig type
export interface SystemConfig {
    version: string;
    basePricePerSqm: number;
    minHourlyRate: number;
    travelBaseFee: number;
    platformFeePercentage: number;
    taxPercentage: number;
    tallGrassMultiplier: number;
    difficultAccessFee: number;
    maxServiceRadiusKm: number;
    cancelPenaltyPercentage: number;
}

// Added missing TierConfig type
export interface TierConfig {
    id: WorkerTier;
    name: string;
    minPoints: number;
    commissionFee: number;
    benefits: string[];
    priorityScoreBonus: number;
}
