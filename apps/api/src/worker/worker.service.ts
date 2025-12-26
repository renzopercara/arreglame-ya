
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkerService {
  constructor(private prisma: PrismaService) {}

  async updateLocation(userId: string, lat: number, lng: number) {
    // Actualizamos las columnas planas para acceso rÃƒ¡pido Y la columna geometry para bÃƒºsquedas espaciales
    // ST_SetSRID(ST_MakePoint(lng, lat), 4326) crea un punto geogrÃƒ¡fico estÃƒ¡ndar (WGS 84)
    
    await (this.prisma as any).$executeRaw`
      UPDATE "WorkerProfile"
      SET 
        latitude = ${lat},
        longitude = ${lng},
        location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
        "lastLocationUpdate" = NOW()
      WHERE "userId" = ${userId}
    `;

    return true;
  }

  async setStatus(userId: string, status: string) {
    return (this.prisma as any).workerProfile.update({
        where: { userId },
        data: { status }
    });
  }
}
