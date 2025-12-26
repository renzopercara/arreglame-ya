
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService
  ) {}

  /**
   * Inicializa la billetera de un usuario si no existe.
   */
  async ensureWalletExists(userId: string) {
    const wallet = await (this.prisma as any).wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return (this.prisma as any).wallet.create({
        data: { userId }
      });
    }
    return wallet;
  }

  /**
   * PROCESO DE INGRESO (CLIENT PAYS)
   * El cliente paga. El dinero entra a la plataforma. 
   * Se asigna el monto neto al "Pending Balance" del trabajador (Escrow).
   */
  async processPaymentIn(jobId: string, paymentId: string, totalAmount: number) {
    const job = await (this.prisma as any).serviceRequest.findUnique({
        where: { id: jobId },
        include: { worker: true }
    });

    if (!job.workerId) throw new BadRequestException("No worker assigned to hold funds for.");

    // 1. Asegurar wallets
    const workerWallet = await this.ensureWalletExists(job.workerId);

    // 2. Calcular Split Real
    // Neto = Total - ComisiÃƒ³n - Impuestos
    // Usamos los valores guardados en el Job para consistencia
    const workerNet = job.priceWorkerNet; 
    const platformFee = job.pricePlatformFee;

    // 3. Crear Transacciones (Ledger)
    return (this.prisma as any).$transaction(async (tx: any) => {
        // A. Registro de entrada total (Para contabilidad interna de plataforma - Opcional aquÃƒ­, 
        // pero importante si tuviÃƒ©ramos una Wallet de Plataforma en DB).

        // B. AsignaciÃƒ³n a Escrow del Trabajador
        await tx.transaction.create({
            data: {
                walletId: workerWallet.id,
                jobId: jobId,
                type: 'ESCROW_ALLOCATION',
                amount: workerNet,
                status: 'COMPLETED',
                description: `Fondos en garantÃƒ­a por trabajo #${jobId.slice(0,8)}`,
                referenceId: paymentId
            }
        });

        // C. Actualizar Saldo Pendiente
        await tx.wallet.update({
            where: { id: workerWallet.id },
            data: { balancePending: { increment: workerNet } }
        });

        // D. Actualizar Estado del Job
        await tx.serviceRequest.update({
            where: { id: jobId },
            data: { status: 'IN_PROGRESS' } // O 'ACCEPTED' si el pago es previo
        });
    });
  }

  /**
   * RELEASE ESCROW (LIBERACIÃƒâ€œN DE FONDOS)
   * Mueve el dinero de Pending a Available.
   * Se ejecuta cuando el cliente confirma o por auto-release timer.
   */
  async releaseFunds(jobId: string) {
    const job = await (this.prisma as any).serviceRequest.findUnique({
      where: { id: jobId },
      include: { worker: true }
    });

    if (!job || job.status === 'COMPLETED') return; // Idempotencia bÃƒ¡sica

    const workerWallet = await this.ensureWalletExists(job.workerId);
    
    // El monto a liberar es el que calculamos al inicio (priceWorkerNet)
    // MÃƒ¡s cualquier ajuste aprobado (TODO: Sumar adjustments)
    const amountToRelease = job.priceWorkerNet;

    await (this.prisma as any).$transaction(async (tx: any) => {
      // 1. Mover de Pending a Available
      await tx.wallet.update({
        where: { id: workerWallet.id },
        data: { 
          balancePending: { decrement: amountToRelease },
          balanceAvailable: { increment: amountToRelease }
        }
      });

      // 2. Registrar TransacciÃƒ³n de LiberaciÃƒ³n
      await tx.transaction.create({
        data: {
          walletId: workerWallet.id,
          jobId: jobId,
          type: 'ESCROW_RELEASE',
          amount: amountToRelease,
          status: 'COMPLETED',
          description: `LiberaciÃƒ³n de pago #${jobId.slice(0,8)}`,
        }
      });

      // 3. Marcar trabajo como Completado (Financieramente cerrado)
      await tx.serviceRequest.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', completedAt: new Date() }
      });
      
      // 4. (Opcional) Trigger Reputation update
    });

    this.logger.log(`Funds released for Job ${jobId}: $${amountToRelease}`);
    return true;
  }

  /**
   * AJUSTE DE PRECIO (MUTATION)
   * Agrega costos extra (Materiales, Tiempo).
   * Requiere pago inmediato del cliente por la diferencia.
   */
  async createAdjustment(jobId: string, amount: number, reason: string, isCommissionable: boolean = true) {
     // 1. Calcular comisiÃƒ³n sobre el ajuste
     const config = await this.configService.get('platformFeePercentage') || 0.25;
     const commission = isCommissionable ? Math.round(amount * config) : 0;
     const workerNetDelta = amount - commission;

     // 2. Actualizar el Job (Solo metadatos, el saldo se toca al pagar)
     const job = await (this.prisma as any).serviceRequest.update({
         where: { id: jobId },
         data: {
             priceTotal: { increment: amount },
             priceWorkerNet: { increment: workerNetDelta },
             pricePlatformFee: { increment: commission },
             // Si son materiales, sumar a priceMaterials tambiÃƒ©n
         }
     });

     return {
         newTotal: job.priceTotal,
         amountToPay: amount,
         workerNetDelta,
         paymentLink: "https://mercadopago..." // AquÃƒ­ generarÃƒ­amos link por la diferencia
     };
  }

  /**
   * SOLICITUD DE RETIRO (PAYOUT)
   */
  async requestPayout(userId: string, amount: number, cbu: string) {
      const wallet = await this.ensureWalletExists(userId);
      const minWithdrawal = 5000; // Configurable

      if (amount < minWithdrawal) {
          throw new BadRequestException(`El retiro mÃƒ­nimo es de $${minWithdrawal}`);
      }

      if (wallet.balanceAvailable < amount) {
          throw new BadRequestException("Saldo insuficiente.");
      }

      await (this.prisma as any).$transaction(async (tx: any) => {
          // 1. Descontar saldo disponible (Bloquear fondos)
          await tx.wallet.update({
              where: { id: wallet.id },
              data: { balanceAvailable: { decrement: amount } }
          });

          // 2. Crear registro de TransacciÃƒ³n (DÃƒ©bito)
          await tx.transaction.create({
              data: {
                  walletId: wallet.id,
                  type: 'WITHDRAWAL',
                  amount: -amount, // Negativo
                  status: 'PENDING',
                  description: `Solicitud retiro a CBU ${cbu.slice(-4)}`
              }
          });

          // 3. Crear Payout Request para admin/procesador
          await tx.payoutRequest.create({
              data: {
                  walletId: wallet.id,
                  amount,
                  cbuAlias: cbu,
                  status: 'REQUESTED'
              }
          });
      });

      return { status: 'REQUESTED', remainingBalance: wallet.balanceAvailable - amount };
  }

  async applyCancellationFee(clientId: string, amount: number) {
      await (this.prisma as any).user.update({
          where: { id: clientId },
          data: { status: 'DEBTOR' }
      });
      // TODO: Crear deuda en una tabla ClientDebt si fuera necesario
  }
}
