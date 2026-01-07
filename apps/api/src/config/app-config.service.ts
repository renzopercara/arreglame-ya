import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TargetAudience } from '@prisma/client';

export interface PlanConfigData {
  code: string;
  targetAudience: TargetAudience;
  name: string;
  minPoints: number;
  commissionFee: number;
  priorityBonus: number;
  benefits: any; // En Prisma es Json
}

/**
 * Application Configuration Service - Loads config from database with caching
 * Separate from @nestjs/config to manage app-specific business logic (plans, reputation)
 */
@Injectable()
export class AppConfigService implements OnModuleInit {
  private readonly logger = new Logger(AppConfigService.name);
  
  private settingsCache: Record<string, any> = {};
  private plansCache: PlanConfigData[] = [];
  private reputationCache: Record<string, number> = {};
  
  private lastFetch: number = 0;
  private readonly CACHE_TTL_MS = 60000;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.refreshCache();
  }

  // --- MÉTODOS PÚBLICOS ---

  async getPlan(planCode: string): Promise<PlanConfigData | undefined> {
    if (this.shouldRefresh()) await this.refreshCache();
    return this.plansCache.find(p => p.code === planCode);
  }

  async getReputationPoints(actionKey: string): Promise<number> {
    if (this.shouldRefresh()) await this.refreshCache();
    return this.reputationCache[actionKey] || 0;
  }

  async determineBestPlan(points: number, audience: TargetAudience): Promise<PlanConfigData> {
    if (this.shouldRefresh()) await this.refreshCache();
    
    const relevantPlans = this.plansCache
      .filter(p => p.targetAudience === audience)
      .sort((a, b) => b.minPoints - a.minPoints);

    if (relevantPlans.length === 0) {
        throw new Error(`No hay planes configurados para la audiencia: ${audience}`);
    }

    const bestPlan = relevantPlans.find(p => points >= p.minPoints);
    return bestPlan || relevantPlans[relevantPlans.length - 1];
  }

  async get<T = any>(key: string, defaultValue?: T): Promise<T> {
    if (this.shouldRefresh()) await this.refreshCache();
    return (this.settingsCache[key] ?? defaultValue) as T;
  }

  // --- LÓGICA DE REFRESH ---

  private shouldRefresh() {
    return Date.now() - this.lastFetch > this.CACHE_TTL_MS;
  }

  async refreshCache() {
    try {
      this.logger.log('Refrescando caché de configuración desde DB...');

      // 1. Cargar Settings del Sistema
      const settings = await this.prisma.systemSetting.findMany();
      this.settingsCache = settings.reduce((acc, item) => {
        acc[item.key] = this.parseValue(item.value, item.type);
        return acc;
      }, {});

      // 2. Cargar Reglas de Reputación (Modelo ReputationRule)
      const reputationRules = await this.prisma.reputationRule.findMany();
      this.reputationCache = reputationRules.reduce((acc, item) => {
        acc[item.actionKey] = item.pointsDelta;
        return acc;
      }, {});

      // 3. Cargar Planes (Modelo PlanConfig)
      const plans = await this.prisma.planConfig.findMany({
        where: { isActive: true }
      });
      
      this.plansCache = plans.map(p => ({
        code: p.code,
        targetAudience: p.targetAudience,
        name: p.name,
        minPoints: p.minPoints,
        commissionFee: p.commissionFee,
        priorityBonus: p.priorityBonus,
        benefits: p.benefits
      }));

      // Si no hay datos en DB, cargar mínimos para no romper la app
      if (plans.length === 0) this.loadDefaultPlans();
      if (reputationRules.length === 0) this.loadDefaultReputation();

      this.lastFetch = Date.now();
      this.logger.log('Configuración sincronizada exitosamente.');
    } catch (e) {
      this.logger.error(`Fallo al refrescar caché: ${e.message}`);
      // Fallback solo si la caché está totalmente vacía
      if (this.plansCache.length === 0) this.loadHardcodedDefaults();
    }
  }

  private parseValue(value: string, type: string) {
    switch (type) {
      case 'NUMBER': return Number(value);
      case 'BOOLEAN': return value === 'true';
      case 'JSON': 
        try { return JSON.parse(value); } 
        catch { return value; }
      default: return value;
    }
  }

  private loadHardcodedDefaults() {
    this.loadDefaultReputation();
    this.loadDefaultPlans();
  }

  private loadDefaultReputation() {
    this.reputationCache = {
      'JOB_COMPLETED': 10,
      'FIVE_STAR_REVIEW': 5,
      'JOB_CANCELLED_BY_WORKER': -20,
      'JOB_CANCELLED_BY_CLIENT': -5
    };
  }

  private loadDefaultPlans() {
    this.plansCache = [
      {
        code: 'STARTER',
        targetAudience: 'WORKER',
        name: 'Plan Starter',
        minPoints: 0,
        commissionFee: 0.15,
        priorityBonus: 0,
        benefits: []
      },
      {
        code: 'CLIENT_BASIC',
        targetAudience: 'CLIENT',
        name: 'Cliente Básico',
        minPoints: 0,
        commissionFee: 0,
        priorityBonus: 0,
        benefits: []
      }
    ];
  }
}
