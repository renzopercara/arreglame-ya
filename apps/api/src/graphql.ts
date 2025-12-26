
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum UserRole {
    CLIENT = "CLIENT",
    WORKER = "WORKER",
    ADMIN = "ADMIN"
}

export enum UserStatus {
    ANON = "ANON",
    LOGGED_IN = "LOGGED_IN",
    BLOCKED = "BLOCKED",
    DEBTOR = "DEBTOR"
}

export enum WorkerStatus {
    ONLINE = "ONLINE",
    PAUSED = "PAUSED",
    OFFLINE = "OFFLINE",
    ON_JOB = "ON_JOB"
}

export enum KYCStatus {
    PENDING_SUBMISSION = "PENDING_SUBMISSION",
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum JobStatus {
    CREATED = "CREATED",
    ACCEPTED = "ACCEPTED",
    ASSIGNED = "ASSIGNED",
    IN_PROGRESS = "IN_PROGRESS",
    PENDING_CLIENT_APPROVAL = "PENDING_CLIENT_APPROVAL",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    DISPUTED = "DISPUTED",
    UNDER_REVIEW = "UNDER_REVIEW",
    RESOLVED = "RESOLVED"
}

export enum ExtraTimeStatus {
    NONE = "NONE",
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export enum TransactionType {
    ESCROW_ALLOCATION = "ESCROW_ALLOCATION",
    ESCROW_RELEASE = "ESCROW_RELEASE",
    WITHDRAWAL = "WITHDRAWAL",
    REFUND = "REFUND",
    PAYOUT = "PAYOUT",
    DISPUTE_REFUND = "DISPUTE_REFUND"
}

export enum TransactionStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED"
}

export interface LoginInput {
    email: string;
    password: string;
    role: UserRole;
}

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    termsAccepted: boolean;
    userAgent?: Nullable<string>;
}

export interface CreateJobInput {
    clientId: string;
    lat: number;
    lng: number;
    image: string;
    description?: Nullable<string>;
    difficulty: number;
    estimatedHours: number;
    squareMeters: number;
    hasHighWeeds?: Nullable<boolean>;
    scheduledFor?: Nullable<string>;
}

export interface EstimateJobInput {
    image: string;
    description?: Nullable<string>;
    squareMeters: number;
    hasHighWeeds?: Nullable<boolean>;
    hasSlope?: Nullable<boolean>;
    complicatedAccess?: Nullable<boolean>;
}

export interface SubmitKYCInput {
    dniFront: string;
    dniBack: string;
    insuranceDoc: string;
    selfie: string;
}

export interface SubmitReviewInput {
    jobId: string;
    rating: number;
    comment?: Nullable<string>;
}

export interface CreateSupportTicketInput {
    jobId: string;
    category: string;
    subject: string;
    description: string;
}

export interface User {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface AuthResponse {
    accessToken: string;
    user: User;
}

export interface UserWithProfile {
    id: string;
    email: string;
    role: UserRole;
    name: string;
    status: UserStatus;
    rating: number;
    loyaltyPoints?: Nullable<number>;
    totalJobs?: Nullable<number>;
    mustAcceptTerms: boolean;
    workerStatus?: Nullable<string>;
    kycStatus?: Nullable<string>;
    bio?: Nullable<string>;
    currentPlan: string;
    balance?: Nullable<number>;
    createdAt: DateTime;
}

export interface WorkerProfile {
    id: string;
    userId: string;
    name: string;
    rating: number;
    totalJobs: number;
    status: WorkerStatus;
    latitude?: Nullable<number>;
    longitude?: Nullable<number>;
    reputationPoints: number;
    currentPlan: string;
    acceptanceRate: number;
    cancellationRate: number;
    penaltyUntil?: Nullable<DateTime>;
    bio?: Nullable<string>;
    kycStatus: KYCStatus;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface ClientProfile {
    id: string;
    userId: string;
    name: string;
    rating: number;
    loyaltyPoints: number;
    reputationPoints: number;
    currentPlan: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface ServiceRequest {
    id: string;
    status: JobStatus;
    clientId: string;
    workerId?: Nullable<string>;
    latitude: number;
    longitude: number;
    address?: Nullable<string>;
    description?: Nullable<string>;
    squareMeters: number;
    gardenImageBefore: string;
    gardenImageAfter?: Nullable<string>;
    evidenceImages?: Nullable<string[]>;
    difficulty: number;
    estimatedHours: number;
    aiReasoning?: Nullable<string>;
    price: PriceDetails;
    pin: string;
    extraTimeStatus: ExtraTimeStatus;
    extraTimeMinutes?: Nullable<number>;
    extraTimeReason?: Nullable<string>;
    createdAt: DateTime;
    startedAt?: Nullable<DateTime>;
    completedAt?: Nullable<DateTime>;
    warrantyExpiresAt?: Nullable<DateTime>;
    client?: Nullable<ClientProfile>;
    worker?: Nullable<WorkerProfile>;
}

export interface PriceDetails {
    total: number;
    workerNet: number;
    platformFee: number;
    taxes: number;
    currency: string;
    calculationSnapshot?: Nullable<string>;
}

export interface Wallet {
    id: string;
    userId: string;
    balancePending: number;
    balanceAvailable: number;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface Transaction {
    id: string;
    walletId: string;
    jobId?: Nullable<string>;
    type: TransactionType;
    amount: number;
    status: TransactionStatus;
    description?: Nullable<string>;
    createdAt: DateTime;
}

export interface PayoutRequest {
    id: string;
    walletId: string;
    amount: number;
    cbuAlias: string;
    status: string;
    createdAt: DateTime;
    processedAt?: Nullable<DateTime>;
}

export interface ChatMessage {
    id: string;
    jobId: string;
    senderId: string;
    content: string;
    timestamp: DateTime;
    sender?: Nullable<WorkerProfile>;
}

export interface LegalDocument {
    id: string;
    targetAudience: string;
    version: string;
    title: string;
    content: string;
    isActive: boolean;
    createdAt: DateTime;
}

export interface UserConsent {
    id: string;
    userId: string;
    documentId: string;
    version: string;
    acceptedAt: DateTime;
}

export interface EstimationResult {
    difficultyMultiplier: number;
    estimatedHours: number;
    estimatedWorkload: string;
    price: PriceDetails;
}

export interface AuditResult {
    approved: boolean;
    score: number;
    reasoning: string;
}

export interface JobHistory {
    id: string;
    status: JobStatus;
    client?: Nullable<ClientProfile>;
    worker?: Nullable<WorkerProfile>;
    description?: Nullable<string>;
    squareMeters?: Nullable<number>;
    price?: Nullable<PriceDetails>;
    createdAt: DateTime;
    completedAt?: Nullable<DateTime>;
    myReview?: Nullable<Review>;
    activeTicket?: Nullable<SupportTicket>;
}

export interface MatchResult {
    batches: WorkerProfile[][];
}

export interface Review {
    id: string;
    jobId: string;
    rating: number;
    comment?: Nullable<string>;
    authorId: string;
    targetId: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface SupportTicket {
    id: string;
    jobId: string;
    reporterId: string;
    category: string;
    priority: string;
    status: string;
    subject: string;
    description: string;
    createdAt: DateTime;
    updatedAt: DateTime;
}

export interface ReputationResponse {
    points: number;
    currentPlan: string;
    nextMilestone?: Nullable<number>;
}

export interface ExtraTimeResponse {
    id: string;
    extraTimeStatus: ExtraTimeStatus;
    totalPrice: number;
}

export interface IQuery {
    me(): Nullable<UserWithProfile> | Promise<Nullable<UserWithProfile>>;
    getPublicWorkerProfile(workerId: string): Nullable<WorkerProfile> | Promise<Nullable<WorkerProfile>>;
    estimateJob(input: EstimateJobInput): Nullable<EstimationResult> | Promise<Nullable<EstimationResult>>;
    getJobHistory(jobId: string): Nullable<JobHistory> | Promise<Nullable<JobHistory>>;
    findBestWorkers(lat: number, lng: number, radiusKm?: Nullable<number>): Nullable<MatchResult> | Promise<Nullable<MatchResult>>;
    nearbyJobs(lat: number, lng: number): ServiceRequest[] | Promise<ServiceRequest[]>;
    chatMessages(jobId: string): ChatMessage[] | Promise<ChatMessage[]>;
    getWallet(): Nullable<Wallet> | Promise<Nullable<Wallet>>;
    getWalletTransactions(): Nullable<Transaction[]> | Promise<Nullable<Transaction[]>>;
    latestTerms(role: string): LegalDocument | Promise<LegalDocument>;
    healthCheckReputation(): string | Promise<string>;
    getWorkerReputation(workerId: string): ReputationResponse | Promise<ReputationResponse>;
}

export interface IMutation {
    login(input: LoginInput): AuthResponse | Promise<AuthResponse>;
    register(input: RegisterInput): AuthResponse | Promise<AuthResponse>;
    createJob(input: CreateJobInput): ServiceRequest | Promise<ServiceRequest>;
    startJob(jobId: string, pin: string): ServiceRequest | Promise<ServiceRequest>;
    arriveAtJob(workerId: string, jobId: string, lat: number, lng: number): boolean | Promise<boolean>;
    completeJob(jobId: string, imageAfter: string, evidenceImages?: Nullable<string[]>): AuditResult | Promise<AuditResult>;
    updateWorkerLocation(lat: number, lng: number): boolean | Promise<boolean>;
    setWorkerStatus(status: string): WorkerProfile | Promise<WorkerProfile>;
    submitKYC(input: SubmitKYCInput): WorkerProfile | Promise<WorkerProfile>;
    processPaymentIn(jobId: string, paymentId: string, totalAmount: number): boolean | Promise<boolean>;
    releaseFunds(jobId: string): boolean | Promise<boolean>;
    requestPayout(amount: number, cbu: string): PayoutRequest | Promise<PayoutRequest>;
    acceptTerms(documentId: string): UserConsent | Promise<UserConsent>;
    acceptLatestTerms(userId: string, documentId: string): boolean | Promise<boolean>;
    sendMessage(jobId: string, senderId: string, role: string, content: string): ChatMessage | Promise<ChatMessage>;
    submitReview(input: SubmitReviewInput): Review | Promise<Review>;
    createSupportTicket(input: CreateSupportTicketInput): SupportTicket | Promise<SupportTicket>;
    requestExtraTime(jobId: string, minutes: number, reason: string): ServiceRequest | Promise<ServiceRequest>;
    respondToExtraTime(jobId: string, approved: boolean): ExtraTimeResponse | Promise<ExtraTimeResponse>;
}

export interface ISubscription {
    jobUpdated(jobId: string): ServiceRequest | Promise<ServiceRequest>;
    workerLocationMoved(jobId: string): LocationUpdate | Promise<LocationUpdate>;
    chatMessageAdded(jobId: string): ChatMessage | Promise<ChatMessage>;
}

export interface LocationUpdate {
    lat: number;
    lng: number;
}

export type DateTime = any;
type Nullable<T> = T | null;
