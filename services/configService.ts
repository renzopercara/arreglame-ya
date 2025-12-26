
import { SystemConfig, WorkerTier, TierConfig } from "../types.ts";

// Simula una tabla de base de datos 'PricingConfig' que puede ser editada por Admin
// sin necesidad de redeployar el cÃƒÂ³digo.

const DEFAULT_CONFIG: SystemConfig = {
    version: "v1.0.2_Summer_2024",
    
    // Tarifas Base
    basePricePerSqm: 150,      // $150 ARS por metro cuadrado base
    minHourlyRate: 6000,       // MÃƒÂ­nimo $6000 ARS por hora de trabajo estimada (ProtecciÃƒÂ³n al trabajador)
    travelBaseFee: 1500,       // $1500 ARS por ir al domicilio
    
    // Porcentajes
    platformFeePercentage: 0.25, // Fallback por defecto (Starter)
    taxPercentage: 0.21,         // 21% IVA sobre comisiÃƒÂ³n
    
    // Surcharges (Recargos)
    tallGrassMultiplier: 1.30,   // +30% si hay yuyos altos
    difficultAccessFee: 2000,    // +$2000 si el acceso es complicado
    
    // Reglas
    maxServiceRadiusKm: 15,
    cancelPenaltyPercentage: 0.30
};

// DEFINICIÃƒâ€œN DE NIVELES (TIERS)
export const TIER_CONFIGS: Record<WorkerTier, TierConfig> = {
    [WorkerTier.STARTER]: {
        id: WorkerTier.STARTER,
        name: "Starter",
        minPoints: 0,
        commissionFee: 0.25, // 25% ComisiÃƒÂ³n
        benefits: ["Acceso a trabajos estÃƒÂ¡ndar"],
        priorityScoreBonus: 0
    },
    [WorkerTier.PRO]: {
        id: WorkerTier.PRO,
        name: "Pro",
        minPoints: 500,
        commissionFee: 0.20, // 20% ComisiÃƒÂ³n
        benefits: ["ComisiÃƒÂ³n reducida", "Prioridad media", "Soporte Preferencial"],
        priorityScoreBonus: 10
    },
    [WorkerTier.ELITE]: {
        id: WorkerTier.ELITE,
        name: "Elite",
        minPoints: 1000,
        commissionFee: 0.15, // 15% ComisiÃƒÂ³n (MÃƒÂ¡xima ganancia)
        benefits: ["MÃƒÂ­nima comisiÃƒÂ³n", "Prioridad FLASH (10s antes)", "Retiros InstantÃƒÂ¡neos"],
        priorityScoreBonus: 25 // Gran salto en el algoritmo de matching
    }
};

export const getSystemConfig = async (): Promise<SystemConfig> => {
    // En producciÃƒÂ³n: return db.pricingConfig.findFirst({ orderBy: { createdAt: 'desc' } });
    return DEFAULT_CONFIG;
};

export const getTierConfig = (tier: WorkerTier): TierConfig => {
    return TIER_CONFIGS[tier];
};

export const calculateTierFromPoints = (points: number): WorkerTier => {
    if (points >= TIER_CONFIGS[WorkerTier.ELITE].minPoints) return WorkerTier.ELITE;
    if (points >= TIER_CONFIGS[WorkerTier.PRO].minPoints) return WorkerTier.PRO;
    return WorkerTier.STARTER;
};
