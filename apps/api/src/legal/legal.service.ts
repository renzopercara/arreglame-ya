
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class LegalService {
  constructor(private prisma: PrismaService) {}

  /**
   * Genera un hash del contenido para asegurar que no se modificÃƒ³ el texto
   * despuÃƒ©s de la aceptaciÃƒ³n del usuario.
   */
  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  async recordConsent(userId: string, version: string, userAgent: string, content: string) {
    const contentHash = this.generateContentHash(content);
    
    return (this.prisma as any).userConsent.create({
      data: {
        userId,
        version,
        userAgent,
        contentHash,
        acceptedAt: new Date(),
      }
    });
  }

  async hasAcceptedLatest(userId: string, role: 'CLIENT' | 'WORKER'): Promise<boolean> {
    const latestDoc = await this.getActiveDocument(role);
    if (!latestDoc) return true; // Si no hay docs, no bloqueamos (riesgoso pero operativo)

    const consent = await (this.prisma as any).userConsent.findFirst({
      where: { 
        userId, 
        documentId: latestDoc.id,
        version: latestDoc.version 
      },
      orderBy: { acceptedAt: 'desc' }
    });
    return !!consent;
  }

  async getActiveDocument(role: 'CLIENT' | 'WORKER') {
    return (this.prisma as any).legalDocument.findFirst({
      where: { targetAudience: role, isActive: true },
      orderBy: { version: 'desc' }
    });
  }

  async acceptTerms(userId: string, documentId: string, metadata: { ip: string, ua: string }) {
    const doc = await (this.prisma as any).legalDocument.findUnique({
      where: { id: documentId }
    });
    
    if (!doc) throw new Error("Documento legal no encontrado");

    return (this.prisma as any).userConsent.create({
      data: {
        userId,
        documentId: doc.id,
        version: doc.version,
        contentHash: this.generateContentHash(doc.content),
        ipAddress: metadata.ip,
        userAgent: metadata.ua,
        acceptedAt: new Date()
      }
    });
  }
}
