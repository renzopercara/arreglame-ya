import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

interface SendEmailOptions {
  to: string;
  subject: string;
  template: string;
  context: Record<string, any>;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.logger.log('MailService inicializado con Handlebars');
  }

  /**
   * Envía un email de verificación con token
   * @param email - Correo del usuario
   * @param name - Nombre del usuario
   * @param verificationToken - Token de verificación
   */
  async sendVerificationEmail(email: string, name: string, verificationToken: string): Promise<void> {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${verificationToken}`;
    
    try {
      await this.sendActionRequiredEmail(
        email,
        name,
        'Verifica tu cuenta',
        'Para completar tu registro y habilitar todas las funcionalidades financieras, por favor verifica tu dirección de email.',
        verificationUrl,
        'Verificar Email',
        {
          deadline: '24 horas',
          details: 'No podrás realizar operaciones de pago hasta que verifiques tu email.',
        }
      );
      this.logger.log(`✅ Email de verificación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando email de verificación a ${email}:`, error);
      throw error;
    }
  }

  /**
   * Envía un email de bienvenida a un usuario recién registrado
   * @param email - Correo del usuario
   * @param name - Nombre del usuario
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: '¡Bienvenido a Arreglame Ya! 🎉',
        template: 'welcome',
        context: {
          name,
          appUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
          activationUrl: `${this.configService.get('FRONTEND_URL')}/dashboard?welcome=true`,
          privacyUrl: `${this.configService.get('FRONTEND_URL')}/privacidad`,
          supportUrl: `${this.configService.get('FRONTEND_URL')}/soporte`,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`✅ Email de bienvenida enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando email de bienvenida a ${email}:`, error);
      throw error;
    }
  }

  /**
   * Envía una notificación por email con contenido dinámico
   * @param email - Correo del usuario
   * @param title - Título de la notificación
   * @param message - Mensaje principal
   * @param options - Opciones adicionales (items, info adicional, CTA)
   */
  async sendNotificationEmail(
    email: string,
    title: string,
    message: string,
    options?: {
      additionalInfo?: string;
      items?: string[];
      ctaText?: string;
      ctaUrl?: string;
    },
  ): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: title,
        template: 'notification',
        context: {
          title,
          message,
          additionalInfo: options?.additionalInfo,
          items: options?.items,
          ctaText: options?.ctaText,
          ctaUrl: options?.ctaUrl,
          appUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`✅ Email de notificación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando email de notificación a ${email}:`, error);
      throw error;
    }
  }

  /**
   * Envía un email que requiere acción del usuario (ej: verificación de email, cambio de contraseña)
   * @param email - Correo del usuario
   * @param name - Nombre del usuario
   * @param title - Título del email
   * @param message - Mensaje descriptivo
   * @param actionUrl - URL donde el usuario debe ir
   * @param actionButtonText - Texto del botón CTA
   * @param options - Opciones adicionales (deadline, detalles)
   */
  async sendActionRequiredEmail(
    email: string,
    name: string,
    title: string,
    message: string,
    actionUrl: string,
    actionButtonText: string = 'Confirmar Acción',
    options?: {
      deadline?: string;
      details?: string;
    },
  ): Promise<void> {
    try {
      await this.sendMail({
        to: email,
        subject: `⚠️ ${title}`,
        template: 'action-required',
        context: {
          name,
          title,
          message,
          actionUrl,
          actionButtonText,
          deadline: options?.deadline,
          details: options?.details,
          supportUrl: `${this.configService.get('FRONTEND_URL')}/soporte`,
          appUrl: this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`✅ Email de acción requerida enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`❌ Error enviando email de acción a ${email}:`, error);
      throw error;
    }
  }

  /**
   * Método genérico para enviar emails usando templates
   * @param options - Opciones de envío (to, subject, template, context)
   */
  private async sendMail(options: SendEmailOptions): Promise<void> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await this.mailerService.sendMail({
          to: options.to,
          subject: options.subject,
          template: options.template,
          context: {
            ...options.context,
            appUrl: options.context.appUrl || this.configService.get('FRONTEND_URL') || 'http://localhost:3000',
            year: options.context.year || new Date().getFullYear(),
          },
        });
        return;
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error(`Falló envío de email después de ${maxRetries} intentos: ${error.message}`);
        }
        // Esperar antes de reintentar
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Envía un email en lote a múltiples destinatarios
   * (Útil para notificaciones masivas)
   */
  async sendBulkEmail(
    emails: string[],
    subject: string,
    template: string,
    context: Record<string, any>,
  ): Promise<void> {
    const results = await Promise.allSettled(
      emails.map((email) =>
        this.sendMail({
          to: email,
          subject,
          template,
          context,
        }),
      ),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    const sent = results.filter((r) => r.status === 'fulfilled').length;

    this.logger.log(`📧 Email enviados: ${sent}/${emails.length} (Fallos: ${failed})`);
  }
}