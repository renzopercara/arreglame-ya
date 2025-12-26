
import { PriceBreakdown, WorkerTier } from "../types.ts";
import { getSystemConfig, getTierConfig } from "./configService.ts";

/**
 * MOTOR DE PRECIOS (PRICING ENGINE)
 * Calcula el precio final basado en mÃƒÂºltiples variables y reglas de negocio.
 * 
 * Update Phase 3: Added support for Dynamic Worker Tiers (Starter, Pro, Elite)
 * to calculate specific commission fees.
 */
export const calculateServicePrice = async (
    squareMeters: number,
    aiEstimatedHours: number,
    aiDifficultyMultiplier: number, // 1.0 a 2.0
    options: {
        hasHighWeeds: boolean;
        complicatedAccess: boolean;
        hasSlope: boolean;
    },
    workerTier: WorkerTier = WorkerTier.STARTER // Default to Starter if unknown at estimation time
): Promise<PriceBreakdown> => {
  const config = await getSystemConfig();
  const tierConfig = getTierConfig(workerTier);
  
  const surchargesApplied: string[] = [];

  // --- 1. CÃƒÂLCULO BASADO EN ESFUERZO (M2) ---
  // Precio Base = m2 * PrecioUnitario
  let workerBasePay = squareMeters * config.basePricePerSqm;

  // Ajuste por Dificultad (AI)
  // Si la IA dice que es difÃƒÂ­cil (ej: 1.5), aumentamos el base.
  workerBasePay = workerBasePay * aiDifficultyMultiplier;

  // --- 2. VALIDACIÃƒâ€œN DE SUELO SALARIAL (HOURLY FLOOR) ---
  // Si el cÃƒÂ¡lculo por m2 da muy poco, usamos el mÃƒÂ­nimo por hora estimado.
  // Ej: 20m2 a $100 = $2000. Pero toma 1 hora ($6000). Cobramos $6000.
  const hourlyFloor = aiEstimatedHours * config.minHourlyRate;
  
  if (hourlyFloor > workerBasePay) {
      workerBasePay = hourlyFloor;
      surchargesApplied.push("Ajuste por MÃƒÂ­nimo Horario");
  }

  // --- 3. RECARGOS ESPECÃƒÂFICOS (CONDITIONS) ---
  
  // Yuyos Altos (Multiplicador)
  if (options.hasHighWeeds) {
      workerBasePay = workerBasePay * config.tallGrassMultiplier;
      surchargesApplied.push(`Yuyos Altos (+${Math.round((config.tallGrassMultiplier - 1)*100)}%)`);
  }

  // Acceso Complicado (Flat Fee)
  if (options.complicatedAccess) {
      workerBasePay += config.difficultAccessFee;
      surchargesApplied.push(`Acceso Complicado (+$${config.difficultAccessFee})`);
  }

  // Pendiente (Multiplicador simple hardcodeado o de config)
  if (options.hasSlope) {
      workerBasePay = workerBasePay * 1.15; // +15%
      surchargesApplied.push("Terreno Inclinado (+15%)");
  }

  // --- 4. TARIFA DE TRASLADO ---
  const travelFee = config.travelBaseFee;

  // --- 5. TOTAL NETO TRABAJADOR ---
  // El trabajador recibe el pago base + traslado.
  // La comisiÃƒÂ³n se resta del total cobrado al cliente (o se suma, dependiendo del modelo mental).
  // Modelo Uber: Cliente paga 100. Plataforma retiene 25. Worker recibe 75.
  // AquÃƒÂ­ calculamos primero cuÃƒÂ¡nto *quiere* ganar el worker, y luego inflamos para el cliente.
  
  const workerNet = Math.round(workerBasePay + travelFee);

  // --- 6. COMISIONES DE PLATAFORMA ---
  // Platform Fee = (WorkerNet / (1 - fee%)) - WorkerNet
  // Esto asegura que si la comisiÃƒÂ³n es 25%, sea 25% del total.
  // Ejemplo: Worker quiere 75. Fee es 25%. Total = 100.
  
  const total = Math.round(workerNet / (1 - tierConfig.commissionFee));
  const platformFee = total - workerNet;
  
  // Impuestos sobre la comisiÃƒÂ³n solamente
  const taxes = Math.round(platformFee * config.taxPercentage);
  const finalTotal = total + taxes; // Cliente paga Total + IVA de comisiÃƒÂ³n

  return {
    total: finalTotal,
    workerNet,
    platformFee,
    taxes,
    currency: 'ARS',
    calculationSnapshot: {
        baseRate: config.basePricePerSqm,
        difficultyMultiplier: aiDifficultyMultiplier,
        appliedSurcharges: surchargesApplied,
        configVersion: config.version,
        workerTierApplied: workerTier
    }
  };
};

export const calculateCancellationFee = async (totalPrice: number): Promise<number> => {
    const config = await getSystemConfig();
    return Math.round(totalPrice * config.cancelPenaltyPercentage);
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount);
};
