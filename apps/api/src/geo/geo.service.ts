import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GeoService {
  constructor(private prisma: PrismaService) {}

  async findWorkersInRadius(lat: number, lng: number, radiusMeters: number = 10000) {
    // Validamos que el cliente no tenga deudas bloqueantes
    // (Esta lógica debería estar en un Middleware, pero la incluimos aquí por arquitectura)
    
    const query = `
      SELECT 
        w.id, 
        w.name, 
        w.rating,
        w."currentPlan",
        ST_Distance(w.location, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) as dist
      FROM "WorkerProfile" w
      JOIN "User" u ON u.id = w."userId"
      WHERE 
        w.status = 'ONLINE' 
        AND u.status != 'BLOCKED'
        AND ST_DWithin(
          w.location,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
      ORDER BY w."currentPlan" DESC, dist ASC
      LIMIT 10
    `;
    return (this.prisma as any).$queryRawUnsafe(query);
  }

  /**
   * Calcula la distancia entre dos puntos usando la fórmula de Haversine
   */
  async calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): Promise<number> {
    const R = 6371e3; // Radio de la Tierra en metros
    
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const deltaP = (lat2 - lat1) * Math.PI / 180;
    const deltaL = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(deltaP / 2) * Math.sin(deltaP / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(deltaL / 2) * Math.sin(deltaL / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }

  async checkGeofence(workerId: string, destLat: number, destLng: number): Promise<boolean> {
    const result: any = await (this.prisma as any).$queryRawUnsafe(`
      SELECT ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(${destLng}, ${destLat}), 4326)::geography
      ) as dist
      FROM "WorkerProfile"
      WHERE id = '${workerId}'
    `);

    const distance = result[0]?.dist || 9999;
    
    // Si la distancia es mayor a 150 metros, lanzamos excepción
    if (distance > 150) {
        throw new BadRequestException(`Estás a ${Math.round(distance)}m. Debes estar a menos de 150m para marcar llegada.`);
    }
    
    return true;
  }
}