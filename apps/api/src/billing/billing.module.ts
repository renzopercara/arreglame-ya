import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingResolver } from './billing.resolver';
import { PricingResolver } from './pricing.resolver';
import { MercadoPagoService } from './mercadopago.service';
import { CommissionService } from './commission.service';
import { PricingService } from './pricing.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '../config/config.module';

/**
 * Billing Module - Payment processing, commissions, pricing, and wallet management
 * Imports ConfigModule to access AppConfigService (@Global) for plan/reputation/system settings
 * 
 * Exports: BillingService, MercadoPagoService, CommissionService, PricingService
 */
@Module({
  imports: [PrismaModule, ConfigModule],
  providers: [BillingService, BillingResolver, PricingResolver, MercadoPagoService, CommissionService, PricingService],
  exports: [BillingService, MercadoPagoService, CommissionService, PricingService],
})
export class BillingModule {}
