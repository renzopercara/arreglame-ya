import { IsNumber, IsString, IsOptional, Min, Max, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// 1. Definir primero la estructura de datos interna
export class MercadoPagoPaymentData {
  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  status_detail?: string;

  @IsOptional()
  @IsString()
  external_reference?: string;

  @IsOptional()
  @IsNumber()
  transaction_amount?: number;
}

// 2. Definir el Webhook que usa la clase anterior
export class MercadoPagoWebhookDto {
  @IsString()
  type: string;

  @ValidateNested()
  @Type(() => MercadoPagoPaymentData)
  data: MercadoPagoPaymentData;

  @IsOptional()
  @IsString()
  action?: string;
}

// 3. DTO para creación de preferencia (Input desde el Front)
export class CreatePaymentPreferenceDto {
  @IsUUID()
  serviceRequestId: string;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  @IsOptional()
  @IsNumber()
  amount?: number;
}

// 4. Desglose de comisiones para la UI
export class CommissionBreakdownDto {
  @IsNumber() baseAmount: number;       // Monto base del servicio
  @IsNumber() totalAmount: number;      // Lo que paga el cliente (base + fee)
  @IsNumber() platformFee: number;      // Comisión de plataforma
  @IsNumber() workerNetAmount: number;  // Lo que recibe el trabajador (base - fee)
  @IsNumber() paymentGatewayFee: number;
  @IsNumber() taxAmount: number;
  @IsString() currency: string;
}