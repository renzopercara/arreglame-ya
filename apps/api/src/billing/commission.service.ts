import { Injectable } from '@nestjs/common';
import { CommissionBreakdownDto } from './billing.dto';

/**
 * Commission Service - Centralized and Immutable
 * 
 * REGLA DE ORO: Este servicio es la ÚNICA fuente de verdad para cálculos de comisiones
 * 
 * Modelo de negocio:
 * - Cliente paga +5% sobre el precio base (fee de plataforma)
 * - Trabajador recibe precio base - 5% (comisión de plataforma)
 * - Plataforma recibe 10% total (5% del cliente + 5% del trabajador)
 */
@Injectable()
export class CommissionService {
  // Immutable commission rates - DO NOT MODIFY without business approval
  private readonly PLATFORM_FEE_PERCENTAGE = 0.05; // 5% fee
  private readonly PAYMENT_GATEWAY_FEE_PCT = 0.0; // Gateway fee (0% by default, puede configurarse)
  private readonly TAX_PCT = 0; // Tax calculation (0% by default, puede configurarse)

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
   */
  calculateFromTotalAmount(totalAmount: number): CommissionBreakdownDto {
    const safeTotal = Math.max(0, totalAmount);
    
    // Reverse calculation: baseAmount = totalAmount / (1 + fee%)
    const baseAmount = this.round(safeTotal / (1 + this.PLATFORM_FEE_PERCENTAGE));
    
    return this.calculateCommissionBreakdown(baseAmount);
  }

  private round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
}
