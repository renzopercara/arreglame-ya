
/*
 * -------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
/* eslint-disable */

export enum ServiceCategory {
    MAINTENANCE = "MAINTENANCE",
    PAINTING = "PAINTING",
    HVAC = "HVAC",
    ELECTRICAL = "ELECTRICAL",
    PLUMBING = "PLUMBING"
}

export enum ServiceSubcategory {
    LAWN_MOWING = "LAWN_MOWING",
    GARDEN_CLEANUP = "GARDEN_CLEANUP",
    TREE_TRIMMING = "TREE_TRIMMING",
    PRESSURE_WASHING = "PRESSURE_WASHING",
    INTERIOR_PAINTING = "INTERIOR_PAINTING",
    EXTERIOR_PAINTING = "EXTERIOR_PAINTING",
    WALL_REPAIR = "WALL_REPAIR",
    AC_INSTALLATION = "AC_INSTALLATION",
    AC_REPAIR = "AC_REPAIR",
    AC_MAINTENANCE = "AC_MAINTENANCE",
    HEATING_INSTALLATION = "HEATING_INSTALLATION",
    OUTLET_INSTALLATION = "OUTLET_INSTALLATION",
    LIGHTING_INSTALLATION = "LIGHTING_INSTALLATION",
    CIRCUIT_BREAKER = "CIRCUIT_BREAKER",
    WIRING_REPAIR = "WIRING_REPAIR",
    LEAK_REPAIR = "LEAK_REPAIR",
    PIPE_INSTALLATION = "PIPE_INSTALLATION",
    DRAIN_CLEANING = "DRAIN_CLEANING",
    FAUCET_INSTALLATION = "FAUCET_INSTALLATION"
}

export enum DifficultyLevel {
    EASY = "EASY",
    MEDIUM = "MEDIUM",
    HARD = "HARD",
    EXPERT = "EXPERT"
}

export interface EstimateJobInput {
    image: string;
    description?: Nullable<string>;
    squareMeters: number;
    hasHighWeeds?: Nullable<boolean>;
    hasSlope?: Nullable<boolean>;
    complicatedAccess?: Nullable<boolean>;
}

export interface CreateJobInput {
    clientId: string;
    lat: number;
    lng: number;
    address?: Nullable<string>;
    image: string;
    description?: Nullable<string>;
    difficulty: number;
    estimatedHours: number;
    squareMeters: number;
    hasHighWeeds?: Nullable<boolean>;
    scheduledFor?: Nullable<string>;
}

export interface PriceEstimateInput {
    subcategory: ServiceSubcategory;
    metadata: JSON;
    difficultyLevel: DifficultyLevel;
    workerId?: Nullable<string>;
}

export interface SubmitKYCInput {
    dniFront: string;
    dniBack: string;
    insuranceDoc: string;
    selfie: string;
}

export interface LoginInput {
    email: string;
    password: string;
    role: string;
}

export interface RegisterInput {
    email: string;
    password: string;
    name: string;
    role: string;
    termsAccepted?: Nullable<boolean>;
    termsVersion?: Nullable<string>;
    termsDate?: Nullable<string>;
    userAgent?: Nullable<string>;
}

export interface UserInfo {
    id: string;
    email: string;
    name: string;
    role: string;
    activeRole: string;
    avatar?: Nullable<string>;
    mustAcceptTerms: boolean;
    mercadopagoCustomerId?: Nullable<string>;
    mercadopagoAccessToken?: Nullable<string>;
    status?: Nullable<string>;
    loyaltyPoints?: Nullable<number>;
    rating?: Nullable<number>;
    balance?: Nullable<number>;
    totalJobs?: Nullable<number>;
    workerStatus?: Nullable<string>;
    kycStatus?: Nullable<string>;
    bio?: Nullable<string>;
    currentPlan?: Nullable<string>;
}

export interface AuthResponse {
    accessToken: string;
    user: UserInfo;
}

export interface JobPrice {
    total: number;
    workerNet: number;
    platformFee: number;
    taxes: number;
    currency: string;
    calculationSnapshot?: Nullable<string>;
}

export interface JobEstimateResponse {
    difficultyMultiplier: number;
    price: JobPrice;
    aiAnalysis?: Nullable<JSON>;
}

export interface AuditResponse {
    approved: boolean;
    confidence: number;
    observations?: Nullable<string[]>;
}

export interface Job {
    id: string;
    status: string;
    description?: Nullable<string>;
    title?: Nullable<string>;
    address?: Nullable<string>;
    city?: Nullable<string>;
    price?: Nullable<JSON>;
    gardenImageBefore?: Nullable<string>;
    gardenImageAfter?: Nullable<string>;
    evidenceImages?: Nullable<string[]>;
    category?: Nullable<string>;
    imageUrl?: Nullable<string>;
    provider?: Nullable<UserInfo>;
}

export interface Review {
    id: string;
    rating: number;
    comment?: Nullable<string>;
}

export interface PaymentPreference {
    preferenceId: string;
    initPoint: string;
}

export interface PriceBreakdown {
    baseCalculation: string;
    difficultyMultiplier: number;
    extras: string[];
}

export interface PriceEstimateResult {
    baseTime: number;
    totalTime: number;
    hourlyRate: number;
    estimatedPrice: number;
    breakdown: PriceBreakdown;
}

export interface CategoryInfo {
    id: ServiceCategory;
    label: string;
}

export interface SubcategoryInfo {
    id: ServiceSubcategory;
    label: string;
}

export interface ReputationInfo {
    points: number;
    currentPlan: string;
    nextMilestone: number;
}

export interface WorkerProfile {
    id: string;
    userId: string;
    name: string;
    status?: Nullable<string>;
    rating?: Nullable<number>;
    totalJobs?: Nullable<number>;
    currentPlan?: Nullable<string>;
    bio?: Nullable<string>;
    kycStatus?: Nullable<string>;
    dniFront?: Nullable<string>;
    dniBack?: Nullable<string>;
    insuranceDoc?: Nullable<string>;
    selfie?: Nullable<string>;
}

export interface UpdateLocationResponse {
    success: boolean;
}

export interface LegalDocument {
    id: string;
    version: string;
    content: string;
    isActive: boolean;
    role?: Nullable<string>;
    createdAt?: Nullable<DateTime>;
    updatedAt?: Nullable<DateTime>;
}

export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    data?: Nullable<JSON>;
    createdAt: DateTime;
    updatedAt?: Nullable<DateTime>;
}

export interface UnreadCountResult {
    count: number;
}

export interface MutationResponse {
    success: boolean;
}

export interface IQuery {
    estimateJob(input: EstimateJobInput): JobEstimateResponse | Promise<JobEstimateResponse>;
    getServices(category?: Nullable<string>, query?: Nullable<string>, location?: Nullable<string>): Job[] | Promise<Job[]>;
    healthCheckReputation(): string | Promise<string>;
    getWorkerReputation(workerId: string): ReputationInfo | Promise<ReputationInfo>;
    getServiceCategories(): CategoryInfo[] | Promise<CategoryInfo[]>;
    getServiceSubcategories(category: ServiceCategory): SubcategoryInfo[] | Promise<SubcategoryInfo[]>;
    getPublicWorkerProfile(workerId: string): Nullable<WorkerProfile> | Promise<Nullable<WorkerProfile>>;
    me(): Nullable<UserInfo> | Promise<Nullable<UserInfo>>;
    latestTerms(role: string): LegalDocument | Promise<LegalDocument>;
    getNotifications(limit?: Nullable<number>): Notification[] | Promise<Notification[]>;
    getUnreadCount(): UnreadCountResult | Promise<UnreadCountResult>;
}

export interface IMutation {
    createJob(input: CreateJobInput): Job | Promise<Job>;
    startJob(jobId: string, pin: string): Job | Promise<Job>;
    arriveAtJob(workerId: string, jobId: string, lat: number, lng: number): boolean | Promise<boolean>;
    completeJob(jobId: string, imageAfter: string, evidenceImages?: Nullable<string[]>): AuditResponse | Promise<AuditResponse>;
    submitReview(input: JSON): Review | Promise<Review>;
    createPaymentPreference(serviceRequestId: string, amount?: Nullable<number>): PaymentPreference | Promise<PaymentPreference>;
    estimateServicePrice(input: PriceEstimateInput): PriceEstimateResult | Promise<PriceEstimateResult>;
    updateWorkerLocation(lat: number, lng: number): UpdateLocationResponse | Promise<UpdateLocationResponse>;
    setWorkerStatus(status: string): WorkerProfile | Promise<WorkerProfile>;
    submitKYC(input: SubmitKYCInput): WorkerProfile | Promise<WorkerProfile>;
    login(input: LoginInput): AuthResponse | Promise<AuthResponse>;
    register(input: RegisterInput): AuthResponse | Promise<AuthResponse>;
    switchActiveRole(activeRole: string): UserInfo | Promise<UserInfo>;
    acceptLatestTerms(userId: string, documentId: string): boolean | Promise<boolean>;
    markNotificationAsRead(notificationId: string): Notification | Promise<Notification>;
    markAllNotificationsAsRead(): MutationResponse | Promise<MutationResponse>;
    deleteNotification(notificationId: string): MutationResponse | Promise<MutationResponse>;
}

export interface ISubscription {
    jobUpdated(jobId: string): Job | Promise<Job>;
}

export type JSON = any;
export type DateTime = any;
type Nullable<T> = T | null;
