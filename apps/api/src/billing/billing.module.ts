import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingResolver } from './billing.resolver';
import { PricingResolver } from './pricing.resolver';
import { MercadoPagoService } from './mercadopago.service';
import { CommissionService } from './commission.service';
import { PricingService } from './pricing.service';
import { LedgerService } from './ledger.service';
import { PaymentService } from './payment.service';
import { DebtManagementService } from './debt-management.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';

/**
 * Billing Module - Payment processing, commissions, pricing, and wallet management
 * 
 * Includes:
 * - Double-entry ledger accounting (LedgerService)
 * - Payment processing with strategy pattern (PaymentService)
 * - Commission calculation with caching (CommissionService)
 * - Debt management (DebtManagementService)
 * - Mercado Pago integration (MercadoPagoService)
 * - Legacy services (BillingService, PricingService)
 * 
 * Exports: All services for use in other modules
 */
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [
    BillingService,
    BillingResolver,
    PricingResolver,
    MercadoPagoService,
    CommissionService,
    PricingService,
    LedgerService,
    PaymentService,
    DebtManagementService,
  ],
  exports: [
    BillingService,
    MercadoPagoService,
    CommissionService,
    PricingService,
    LedgerService,
    PaymentService,
    DebtManagementService,
  ],
})
export class BillingModule {}
