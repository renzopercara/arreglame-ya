import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ObjectType, 
  Field, 
  Float, 
  Int, 
  registerEnumType, 
  InputType 
} from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';

// --- ENUMS ---
export enum ServiceCategory {
  MAINTENANCE = 'MAINTENANCE',
  PAINTING = 'PAINTING',
  HVAC = 'HVAC',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
}

export enum ServiceSubcategory {
  LAWN_MOWING = 'LAWN_MOWING',
  GARDEN_CLEANUP = 'GARDEN_CLEANUP',
  TREE_TRIMMING = 'TREE_TRIMMING',
  PRESSURE_WASHING = 'PRESSURE_WASHING',
  INTERIOR_PAINTING = 'INTERIOR_PAINTING',
  EXTERIOR_PAINTING = 'EXTERIOR_PAINTING',
  WALL_REPAIR = 'WALL_REPAIR',
  AC_INSTALLATION = 'AC_INSTALLATION',
  AC_REPAIR = 'AC_REPAIR',
  AC_MAINTENANCE = 'AC_MAINTENANCE',
  HEATING_INSTALLATION = 'HEATING_INSTALLATION',
  OUTLET_INSTALLATION = 'OUTLET_INSTALLATION',
  LIGHTING_INSTALLATION = 'LIGHTING_INSTALLATION',
  CIRCUIT_BREAKER = 'CIRCUIT_BREAKER',
  WIRING_REPAIR = 'WIRING_REPAIR',
  LEAK_REPAIR = 'LEAK_REPAIR',
  PIPE_INSTALLATION = 'PIPE_INSTALLATION',
  DRAIN_CLEANING = 'DRAIN_CLEANING',
  FAUCET_INSTALLATION = 'FAUCET_INSTALLATION',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
}

registerEnumType(ServiceCategory, { name: 'ServiceCategory' });
registerEnumType(ServiceSubcategory, { name: 'ServiceSubcategory' });
registerEnumType(DifficultyLevel, { name: 'DifficultyLevel' });

// --- OBJECT TYPES / INPUTS ---
@InputType()
export class PriceEstimateInput {
  @Field(() => ServiceSubcategory)
  subcategory: ServiceSubcategory;

  @Field(() => GraphQLJSON)
  metadata: Record<string, any>;

  @Field(() => DifficultyLevel, { defaultValue: DifficultyLevel.MEDIUM })
  difficultyLevel?: DifficultyLevel;

  @Field({ nullable: true })
  workerId?: string;
}

@ObjectType()
export class PriceBreakdown {
  @Field() baseCalculation: string;
  @Field(() => Float) difficultyMultiplier: number;
  @Field(() => [String]) extras: string[];
}

@ObjectType()
export class PriceEstimateResult {
  @Field(() => Float) baseTime: number;
  @Field(() => Float) totalTime: number;
  @Field(() => Int) hourlyRate: number;
  @Field(() => Int) estimatedPrice: number;
  @Field(() => PriceBreakdown) breakdown: PriceBreakdown;
}

@ObjectType()
export class CategoryInfo {
  @Field(() => ServiceCategory) id: ServiceCategory;
  @Field() label: string;
}

@ObjectType()
export class SubcategoryInfo {
  @Field(() => ServiceSubcategory) id: ServiceSubcategory;
  @Field() label: string;
}

// --- LÓGICA DE TIEMPOS ---
const BASE_TIME_CONFIGS: Record<ServiceSubcategory, (m: any) => number> = {
  [ServiceSubcategory.LAWN_MOWING]: (m) => (m.squareMeters || 50) / 50,
  [ServiceSubcategory.GARDEN_CLEANUP]: (m) => (m.squareMeters || 50) / 30,
  [ServiceSubcategory.TREE_TRIMMING]: (m) => (m.trees || 1) * 2,
  [ServiceSubcategory.PRESSURE_WASHING]: (m) => (m.squareMeters || 50) / 40,
  [ServiceSubcategory.INTERIOR_PAINTING]: (m) => ((m.squareMeters || 10) / 10) * (m.coats || 1) * 2,
  [ServiceSubcategory.EXTERIOR_PAINTING]: (m) => ((m.squareMeters || 10) / 10) * (m.coats || 1) * 2.5,
  [ServiceSubcategory.WALL_REPAIR]: (m) => (m.squareMeters || 5) / 5 * 1.5,
  [ServiceSubcategory.AC_INSTALLATION]: (m) => (m.type === 'SPLIT' ? 4 : 3) * (m.units || 1),
  [ServiceSubcategory.AC_REPAIR]: () => 2,
  [ServiceSubcategory.AC_MAINTENANCE]: (m) => 1.5 * (m.units || 1),
  [ServiceSubcategory.HEATING_INSTALLATION]: () => 5,
  [ServiceSubcategory.OUTLET_INSTALLATION]: (m) => 0.5 * (m.units || 1),
  [ServiceSubcategory.LIGHTING_INSTALLATION]: (m) => 1 * (m.units || 1),
  [ServiceSubcategory.CIRCUIT_BREAKER]: () => 2,
  [ServiceSubcategory.WIRING_REPAIR]: (m) => (m.meters || 10) / 10,
  [ServiceSubcategory.LEAK_REPAIR]: () => 1.5,
  [ServiceSubcategory.PIPE_INSTALLATION]: (m) => (m.meters || 5) / 5 * 2,
  [ServiceSubcategory.DRAIN_CLEANING]: () => 1,
  [ServiceSubcategory.FAUCET_INSTALLATION]: (m) => 0.75 * (m.units || 1),
};

const DIFFICULTY_MULTIPLIERS = { EASY: 1.0, MEDIUM: 1.2, HARD: 1.5, EXPERT: 2.0 };
const EXTRAS_MULTIPLIERS: Record<string, number> = { URGENT: 1.5, HEIGHT: 1.2, DIFFICULT_ACCESS: 1.3, WEEKEND: 1.4, NIGHT: 1.5 };

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);
  private readonly DEFAULT_HOURLY_RATE = 3500;

  constructor(private prisma: PrismaService) {}

  async estimatePrice(input: PriceEstimateInput): Promise<PriceEstimateResult> {
    const baseTime = this.calculateBaseTime(input.subcategory, input.metadata);
    const diffMult = DIFFICULTY_MULTIPLIERS[input.difficultyLevel || DifficultyLevel.MEDIUM];
    
    let extrasMult = 1.0;
    const extrasList: string[] = [];
    (input.metadata.extras || []).forEach(e => {
      if (EXTRAS_MULTIPLIERS[e]) {
        extrasMult *= EXTRAS_MULTIPLIERS[e];
        extrasList.push(e);
      }
    });

    const totalTime = baseTime * diffMult * extrasMult;
    const hourlyRate = await this.getHourlyRate(input.workerId);
    
    return {
      baseTime: Math.round(baseTime * 100) / 100,
      totalTime: Math.round(totalTime * 100) / 100,
      hourlyRate,
      estimatedPrice: Math.round(totalTime * hourlyRate),
      breakdown: {
        baseCalculation: `Cálculo para ${input.subcategory}`,
        difficultyMultiplier: diffMult,
        extras: extrasList,
      },
    };
  }

  private calculateBaseTime(sub: ServiceSubcategory, meta: any): number {
    return BASE_TIME_CONFIGS[sub] ? Math.max(0.5, BASE_TIME_CONFIGS[sub](meta)) : 2;
  }

  private async getHourlyRate(workerId?: string): Promise<number> {
    if (!workerId) return this.DEFAULT_HOURLY_RATE;
    const worker = await this.prisma.workerProfile.findUnique({ where: { id: workerId }, select: { hourlyRate: true } });
    return worker?.hourlyRate || this.DEFAULT_HOURLY_RATE;
  }

  getCategories(): CategoryInfo[] {
    return [
      { id: ServiceCategory.MAINTENANCE, label: 'Mantenimiento' },
      { id: ServiceCategory.PAINTING, label: 'Pintura' },
      { id: ServiceCategory.HVAC, label: 'Climatización' },
      { id: ServiceCategory.ELECTRICAL, label: 'Electricidad' },
      { id: ServiceCategory.PLUMBING, label: 'Plomería' },
    ];
  }

  getSubcategories(cat: ServiceCategory): SubcategoryInfo[] {
    const map: Record<ServiceCategory, SubcategoryInfo[]> = {
        [ServiceCategory.MAINTENANCE]: [
            { id: ServiceSubcategory.LAWN_MOWING, label: 'Corte de Pasto' },
            { id: ServiceSubcategory.GARDEN_CLEANUP, label: 'Limpieza de Jardín' },
        ],
        [ServiceCategory.PAINTING]: [
            { id: ServiceSubcategory.INTERIOR_PAINTING, label: 'Pintura Interior' },
        ],
        [ServiceCategory.HVAC]: [
            { id: ServiceSubcategory.AC_INSTALLATION, label: 'Instalación AC' },
        ],
        [ServiceCategory.ELECTRICAL]: [
            { id: ServiceSubcategory.OUTLET_INSTALLATION, label: 'Tomacorrientes' },
        ],
        [ServiceCategory.PLUMBING]: [
            { id: ServiceSubcategory.LEAK_REPAIR, label: 'Reparación de Fugas' },
        ],
    };
    return map[cat] || [];
  }
}