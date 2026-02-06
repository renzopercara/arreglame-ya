import { Injectable, Logger } from '@nestjs/common';
import { CommissionBreakdownDto } from './billing.dto';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Commission Service - Centralized and Immutable with Caching
 * 
 * REGLA DE ORO: Este servicio es la ÚNICA fuente de verdad para cálculos de comisiones
 * 
 * Modelo de negocio:
 * - Cliente paga +5% sobre el precio base (fee de plataforma)
 * - Trabajador recibe precio base - 5% (comisión de plataforma)
 * - Plataforma recibe 10% total (5% del cliente + 5% del trabajador)
 * 
 * Features:
 * - In-memory caching of commission rates
 * - Configurable from database (SystemSetting table)
 * - Snapshotting support for immutable transaction records
 */
@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  // Immutable commission rates - DO NOT MODIFY without business approval
  private PLATFORM_FEE_PERCENTAGE = 0.05; // 5% fee
  private PAYMENT_GATEWAY_FEE_PCT = 0.0; // Gateway fee (0% by default, puede configurarse)
  private TAX_PCT = 0; // Tax calculation (0% by default, puede configurarse)

  // Cache for commission configuration
  private configCache: Map<string, number> = new Map();
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(private prisma: PrismaService) {
    this.loadConfiguration();
  }

  /**
   * Calculate commission breakdown from base amount
   * 
   * @param baseAmount - El monto base del servicio (lo que cobra el trabajador)
   * @returns CommissionBreakdownDto con todos los montos calculados
   * 
   * Ejemplo:
   * baseAmount = 1000 ARS
   * - platformFee = 50 ARS (5% sobre base)
   * - totalAmount (cliente paga) = 1050 ARS (base + fee)
   * - workerNetAmount (trabajador recibe) = 950 ARS (base - fee)
   */
  calculateCommissionBreakdown(baseAmount: number): CommissionBreakdownDto {
    // Security: Prevent negative amounts
    const safeBaseAmount = Math.max(0, baseAmount);

    // Calculate platform fee (5% of base)
    const platformFee = this.round(safeBaseAmount * this.PLATFORM_FEE_PERCENTAGE);
    
    // Cliente paga: base + plataforma fee
    const totalAmount = this.round(safeBaseAmount + platformFee);
    
    // Trabajador recibe: base - plataforma fee
    const workerNetAmount = this.round(safeBaseAmount - platformFee);
    
    // Payment gateway fee (if applicable)
    const paymentGatewayFee = this.round(totalAmount * this.PAYMENT_GATEWAY_FEE_PCT);
    
    // Tax amount (if applicable)
    const taxAmount = this.round(totalAmount * this.TAX_PCT);

    return {
      baseAmount: safeBaseAmount,      // Monto base del servicio
      totalAmount,                      // Lo que paga el cliente (base + 5%)
      platformFee,                      // Comisión de plataforma (5% del base)
      workerNetAmount,                  // Lo que recibe el trabajador (base - 5%)
      paymentGatewayFee,                // Fee de pasarela de pago
      taxAmount,                        // Impuestos
      currency: 'ARS',
    };
  }

  /**
   * Calculate reverse: from total amount that client pays, get breakdown
   * 
   * @param totalAmount - Lo que paga el cliente
   * @returns CommissionBreakdownDto con todos los montos calculados
   * 
   * Ejemplo:
   * totalAmount = 1050 ARS (lo que paga el cliente)
   * - baseAmount = 1000 ARS (total / 1.05)
   * - platformFee = 50 ARS
   * - workerNetAmount = 950 ARS
   * 
   * Note: Uses division which may introduce floating-point precision issues.
   * For critical financial calculations, consider using a Decimal library.
   */
  calculateFromTotalAmount(totalAmount: number): CommissionBreakdownDto {
    const safeTotal = Math.max(0, totalAmount);
    
    // Reverse calculation: baseAmount = totalAmount / (1 + fee%)
    const baseAmount = this.round(safeTotal / (1 + this.PLATFORM_FEE_PERCENTAGE));
    
    return this.calculateCommissionBreakdown(baseAmount);
  }

  /**
   * Load commission configuration from database
   * Falls back to default values if not found
   */
  async loadConfiguration(): Promise<void> {
    try {
      const settings = await this.prisma.systemSetting.findMany({
        where: {
          key: {
            in: [
              'PLATFORM_FEE_PERCENTAGE',
              'PAYMENT_GATEWAY_FEE_PCT',
              'TAX_PCT',
            ],
          },
        },
      });

      for (const setting of settings) {
        const value = parseFloat(setting.value);
        this.configCache.set(setting.key, value);

        // Update in-memory values
        if (setting.key === 'PLATFORM_FEE_PERCENTAGE') {
          this.PLATFORM_FEE_PERCENTAGE = value;
        } else if (setting.key === 'PAYMENT_GATEWAY_FEE_PCT') {
          this.PAYMENT_GATEWAY_FEE_PCT = value;
        } else if (setting.key === 'TAX_PCT') {
          this.TAX_PCT = value;
        }
      }

      this.cacheTimestamp = Date.now();
      this.logger.log('Commission configuration loaded from database');
    } catch (error) {
      this.logger.warn(
        'Failed to load commission config from database, using defaults',
      );
    }
  }

  /**
   * Refresh cache if TTL expired
   */
  private async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.cacheTimestamp > this.CACHE_TTL) {
      await this.loadConfiguration();
    }
  }

  /**
   * Get current commission rates (for snapshotting)
   * Returns rates in basis points (e.g., 500 = 5.00%)
   */
  async getCommissionRates(): Promise<{
    platformFeePercent: number;
    serviceTaxPercent: number;
    gatewayFeePercent: number;
  }> {
    await this.refreshCacheIfNeeded();

    return {
      platformFeePercent: Math.round(this.PLATFORM_FEE_PERCENTAGE * 10000),
      serviceTaxPercent: Math.round(this.TAX_PCT * 10000),
      gatewayFeePercent: Math.round(this.PAYMENT_GATEWAY_FEE_PCT * 10000),
    };
  }

  /**
   * Create snapshot data for a transaction
   * Captures current rates and breakdown at T0
   */
  async createSnapshot(totalAmount: number): Promise<{
    platformFeePercent: number;
    serviceTaxPercent: number;
    platformAmount: number;
    professionalAmount: number;
    metadata: any;
  }> {
    const breakdown = this.calculateFromTotalAmount(totalAmount);
    const rates = await this.getCommissionRates();

    return {
      platformFeePercent: rates.platformFeePercent,
      serviceTaxPercent: rates.serviceTaxPercent,
      platformAmount: breakdown.platformFee,
      professionalAmount: breakdown.workerNetAmount,
      metadata: {
        breakdown,
        timestamp: new Date().toISOString(),
        rates,
      },
    };
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
