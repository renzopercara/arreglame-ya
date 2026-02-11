
export enum UserRole {
  CLIENT = 'CLIENT',
  WORKER = 'WORKER',
  ADMIN = 'ADMIN'
}

export enum ActiveRole {
  CLIENT = 'CLIENT',
  WORKER = 'WORKER'
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

export enum KYCStatus {
  NOT_SUBMITTED = 'NOT_SUBMITTED',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum JobStatus {
  CREATED = 'CREATED',
  ACCEPTED = 'ACCEPTED',
  ASSIGNED = 'ASSIGNED',
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

export enum TransactionType {
  PAYMENT = 'PAYMENT',       // Cliente paga
  DEPOSIT = 'DEPOSIT',       // Ingreso al worker
  WITHDRAWAL = 'WITHDRAWAL', // Retiro a CBU
  REFUND = 'REFUND',         // DevoluciÃƒÂ³n
  FEE = 'FEE',               // ComisiÃƒÂ³n plataforma
  TIP = 'TIP'                // Propina
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
    aiAuditScore?: number;
    deciderRole?: UserRole;
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
  evidenceImages?: string[];
  difficulty: number;
  estimatedHours: number;
  price: PriceBreakdown;
  createdAt: number;
  completedAt?: number;
  warrantyExpiresAt?: number;
  pin?: string;
  
  extraTimeMinutes?: number;
  extraTimeStatus?: ExtraTimeStatus;
  extraTimeReason?: string;
  
  dispute?: DisputeInfo;
  
  clientName?: string;
  workerName?: string;
  
  // Historial Details
  myReview?: { rating: number, comment: string };
  activeTicket?: { id: string, status: string, description: string };
}

export interface AppNotification {
  id: string;
  toUserId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
}

export interface ChatMessage {
    id: string;
    jobId: string;
    senderId: string;
    senderRole: UserRole;
    content: string;
    timestamp: number;
}

export interface WorkerProfile {
  id: string;
  name: string;
  rating: number;
  totalJobs: number;
  status: WorkerStatus;
  kycStatus: KYCStatus; // Added
  bio?: string; // Added
  balance: number;
  location: GeoLocation;
  reputationPoints: number;
  currentPlan: WorkerTier;
}

export interface PaymentMethod {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex';
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  date: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  referenceId?: string; // Job ID or Payout ID
}

export interface AppState {
  currentUserRole: UserRole;
  currentClient: any;
  currentWorker: any;
  requests: ServiceRequest[];
  notifications: AppNotification[];
  gpsStatus: GPSStatus;
  showForcedTerms: boolean;
}

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

export interface TierConfig {
    id: WorkerTier;
    name: string;
    minPoints: number;
    commissionFee: number;
    benefits: string[];
    priorityScoreBonus: number;
}
