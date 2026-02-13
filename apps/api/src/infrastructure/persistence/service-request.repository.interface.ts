import { ServiceRequestEntity } from '../../domain/entities/service-request.entity';

/**
 * Service Request Repository Interface
 * Abstract repository for persistence operations
 */
export interface IServiceRequestRepository {
  /**
   * Save service request (create or update)
   */
  save(entity: ServiceRequestEntity): Promise<void>;

  /**
   * Find service request by ID
   */
  findById(id: string): Promise<ServiceRequestEntity | null>;

  /**
   * Find service request by idempotency key
   */
  findByIdempotencyKey(key: string): Promise<ServiceRequestEntity | null>;

  /**
   * Find service requests with worker timeout
   */
  findWithExpiredWorkerTimeout(): Promise<ServiceRequestEntity[]>;

  /**
   * Find completed requests ready for payout release
   */
  findReadyForPayoutRelease(): Promise<ServiceRequestEntity[]>;

  /**
   * Begin transaction
   */
  beginTransaction(): Promise<any>;

  /**
   * Commit transaction
   */
  commitTransaction(tx: any): Promise<void>;

  /**
   * Rollback transaction
   */
  rollbackTransaction(tx: any): Promise<void>;
}
