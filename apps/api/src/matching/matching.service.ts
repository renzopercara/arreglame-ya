
import { Injectable, Logger } from '@nestjs/common';
import { GeoService } from '../geo/geo.service';
import { ConfigService } from '../config/config.service';

interface MatchCandidate {
    id: string;
    name: string;
    rating: number; // 0-5
    acceptanceRate: number; // 0-1
    cancellationRate: number; // 0-1
    currentPlan: string;
    lat: number;
    lng: number;
    
    // Calculated fields
    distanceMeters: number;
    finalScore: number;
    debugBreakdown?: string;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
      private geoService: GeoService,
      private configService: ConfigService
  ) {}

  /**
   * ALGORITMO DE SELECCIÃƒâ€œN (THE MATCHER V2)
   * Integra Planes, Distancia y ReputaciÃƒ³n.
   */
  async findBestWorkersBatched(requestLat: number, requestLng: number, maxRadiusKm: number = 15) {
    const radiusMeters = maxRadiusKm * 1000;
    
    // 1. Obtener candidatos filtrados (Online, Sin Deuda, Sin PenalizaciÃƒ³n)
    const rawCandidates: any[] = await this.geoService.findWorkersInRadius(requestLat, requestLng, radiusMeters);

    if (rawCandidates.length === 0) return { batches: [] };

    // 2. Calcular Scores
    const scoredCandidates: MatchCandidate[] = await Promise.all(rawCandidates.map(async (worker) => {
      
      // A. DISTANCIA (35 Pts Max)
      // MÃƒ¡s cerca = MÃƒ¡s puntaje.
      const distanceMeters = await this.geoService.calculateDistance(worker.lat, worker.lng, requestLat, requestLng);
      const distRatio = Math.max(0, 1 - (distanceMeters / radiusMeters)); 
      const distanceScore = distRatio * 35; 

      // B. RATING (35 Pts Max)
      // 5 estrellas = 35 pts. 1 estrella = 7 pts.
      const ratingNorm = worker.rating / 5.0; 
      const ratingScore = ratingNorm * 35;

      // C. PLAN TIER BONUS (0, 10, 25 Pts)
      const planConfig = await this.configService.getPlan(worker.currentPlan);
      const tierBonus = planConfig.priorityBonus; 

      // D. RELIABILITY & PENALTIES
      // Acceptance: Premia aceptar trabajos (+5 pts max)
      const acceptanceBonus = (worker.acceptanceRate || 0.8) * 5;
      
      // Cancellation: Penaliza cancelar trabajos (-50 factor)
      // Si cancela 10% -> -5 pts. Si cancela 50% -> -25 pts.
      const cancelPenalty = (worker.cancellationRate || 0.0) * 50;

      // SCORE FINAL
      const finalScore = (distanceScore + ratingScore + tierBonus + acceptanceBonus) - cancelPenalty;

      return {
        ...worker,
        distanceMeters,
        finalScore,
        debugBreakdown: `Dist:${distanceScore.toFixed(1)} Rate:${ratingScore.toFixed(1)} Tier:${tierBonus} Rel:${acceptanceBonus.toFixed(1)} Pen:-${cancelPenalty.toFixed(1)}`
      };
    }));

    // 3. Ordenar por Score descendente
    scoredCandidates.sort((a, b) => b.finalScore - a.finalScore);
    
    this.logger.log(`Matching Calculation for Request @ ${requestLat},${requestLng}:`);
    scoredCandidates.slice(0, 5).forEach((c, i) => {
        this.logger.log(`#${i+1} [${c.currentPlan}] ${c.name}: Score ${c.finalScore.toFixed(1)} (${c.debugBreakdown})`);
    });

    // 4. Agrupar en Batches (Lotes anti-spam)
    // Batch 1: "La Crema" (Top 3) - Elite cercanos o Pro muy cercanos
    // Batch 2: Siguientes 5
    // Batch 3: Resto
    const batch1 = scoredCandidates.slice(0, 3);
    const batch2 = scoredCandidates.slice(3, 8);
    const batch3 = scoredCandidates.slice(8);

    return {
        batches: [batch1, batch2, batch3].filter(b => b.length > 0)
    };
  }
}
