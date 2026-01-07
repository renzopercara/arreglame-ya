
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppConfigService } from '../config/app-config.service';
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    private prisma: PrismaService,
    private configService: AppConfigService
  ) {}

  /**
   * Procesa una acciÃƒ³n para el trabajador y actualiza su plan si corresponde.
   */
  async processAction(workerId: string, actionKey: string): Promise<void> {
    const pointsDelta = await this.configService.getReputationPoints(actionKey);
    const worker = await (this.prisma as any).workerProfile.findUnique({ where: { id: workerId } });
    if (!worker) return;

    const newPoints = Math.max(0, worker.reputationPoints + pointsDelta);
    
    // Determine new plan with Hysteresis (10% grace for downgrades)
    const newPlanConfig = await this.configService.determineBestPlan(newPoints, 'WORKER');
    const newPlanCode = newPlanConfig.code;
    const currentPlanCode = worker.currentPlan;

    await (this.prisma as any).workerProfile.update({
        where: { id: workerId },
        data: {
            reputationPoints: newPoints,
            currentPlan: newPlanCode,
        }
    });

    this.logAndAuditReputation(worker.name, 'WORKER', actionKey, pointsDelta, currentPlanCode, newPlanCode);
  }

  /**
   * Procesa una acciÃƒ³n para el cliente y actualiza su plan si corresponde.
   */
  async processClientAction(clientId: string, actionKey: string): Promise<void> {
      const pointsDelta = await this.configService.getReputationPoints(actionKey);
      const client = await (this.prisma as any).clientProfile.findUnique({ where: { id: clientId } });
      if (!client) return;

      const newPoints = Math.max(0, client.reputationPoints + pointsDelta);
      const newPlanConfig = await this.configService.determineBestPlan(newPoints, 'CLIENT');
      const newPlanCode = newPlanConfig.code;
      const currentPlanCode = client.currentPlan;

      await (this.prisma as any).clientProfile.update({
          where: { id: clientId },
          data: {
              reputationPoints: newPoints,
              currentPlan: newPlanCode
          }
      });

      this.logAndAuditReputation(client.name, 'CLIENT', actionKey, pointsDelta, currentPlanCode, newPlanCode);
  }

  /**
   * Maneja el impacto en reputaciÃƒ³n tras resolver una disputa.
   */
  async resolveDisputeReputation(jobId: string, resolution: string): Promise<void> {
      const job = await (this.prisma as any).serviceRequest.findUnique({ 
          where: { id: jobId },
          include: { worker: true, client: true }
      });
      if (!job) return;

      switch(resolution) {
          case 'FULL_REFUND': // Culpa del trabajador
              await this.processAction(job.workerId, 'DISPUTE_LOST_WORKER_FAULT');
              break;
          case 'FULL_PAYMENT': // Intento de fraude del cliente o trabajo ok
              await this.processClientAction(job.clientId, 'DISPUTE_INVALID_CLIENT_REPORT');
              await this.processAction(job.workerId, 'DISPUTE_WON_WORKER');
              break;
          case 'PARTIAL_REFUND': // Fallas leves en ambos o falta de acuerdo
              await this.processAction(job.workerId, 'DISPUTE_LOST_WORKER_FAULT');
              // PenalizaciÃƒ³n menor amortizada
              break;
      }
  }

  private logAndAuditReputation(name: string, role: string, action: string, delta: number, oldPlan: string, newPlan: string) {
      const sign = delta >= 0 ? '+' : '';
      this.logger.log(`[Reputation Audit] ${role} ${name}: Action ${action} (${sign}${delta} pts). Plan: ${oldPlan} -> ${newPlan}`);
      
      if (newPlan !== oldPlan) {
          // Trigger PUSH NOTIFICATION for Tier change logic here
          this.logger.log(`Ã°Å¸Å½Å  NOTIFICATION: ${name} is now ${newPlan}!`);
      }
  }
}
