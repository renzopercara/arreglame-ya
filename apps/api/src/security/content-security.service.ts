
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContentSecurityService {
  private readonly logger = new Logger(ContentSecurityService.name);

  // Patrones robustos para detectar evasiÃƒ³n y contacto
  private readonly BLOCK_PATTERNS = [
    // TelÃƒ©fonos (Formatos: 11223344, 11 2233 4455, +54...)
    /(?:\+?54)?(?:\s?\d{1,4}){2,}/i,
    /(cel|tel|wsp|whatsapp|nume|llame|llamo|contacto).*(?:\d{3,})/i,
    
    // EvasiÃƒ³n de plataforma y dinero en efectivo
    /(precio|cobro|pago|plata).*(diferente|distinto|otro|arreglo|efectivo|mano|cash|afuera|fuera)/i,
    /(descuento|rebaja|barato).*(si|por).*(efectivo|mano)/i,
    /(cbu|alias|cvu|transferencia|mercado|pago|enviame)/i,
    
    // Intento de negociaciÃƒ³n directa
    /(arreglamos|arreglemos).*(nosotros|privado|directo)/i,
    /(pasame).*(numero|id|insta|ig|face|perfil)/i
  ];

  private readonly MAX_VIOLATIONS = 3;

  constructor(private prisma: PrismaService) {}

  /**
   * Valida el contenido y aplica sanciones automÃƒ¡ticas si es necesario.
   */
  async validateMessageContent(userId: string, jobId: string, content: string): Promise<boolean> {
    let violated = false;
    
    for (const pattern of this.BLOCK_PATTERNS) {
      if (pattern.test(content)) {
        violated = true;
        break;
      }
    }

    if (violated) {
      // 1. Loggear la violaciÃƒ³n
      await (this.prisma as any).securityLog.create({
        data: {
          userId,
          jobId,
          content,
          action: 'MESSAGE_BLOCKED',
          severity: 'HIGH'
        }
      });

      // 2. Contar violaciones recientes del usuario (Ãƒºltimas 24hs)
      const violationCount = await (this.prisma as any).securityLog.count({
        where: {
          userId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }
      });

      // 3. SuspensiÃƒ³n AutomÃƒ¡tica
      if (violationCount >= this.MAX_VIOLATIONS) {
        await (this.prisma as any).user.update({
          where: { id: userId },
          data: { status: 'BLOCKED' }
        });
        
        this.logger.error(`USER SUSPENDED: ${userId} reached ${violationCount} violations.`);
        throw new Error("CUENTA SUSPENDIDA. Has violado nuestras polÃƒ­ticas de seguridad repetidamente. Tu acceso ha sido revocado.");
      }

      throw new Error(
        "MENSAJE BLOQUEADO. Por tu seguridad y la del sistema, no se permite compartir datos de contacto ni negociar pagos fuera de la plataforma."
      );
    }

    return true;
  }
}
