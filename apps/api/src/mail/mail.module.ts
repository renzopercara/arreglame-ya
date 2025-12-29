import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { MailService } from './mail.service';

@Module({
  imports: [
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get('MAIL_SMTP_HOST'),
          port: configService.get('MAIL_SMTP_PORT') || 587,
          secure: configService.get('MAIL_SMTP_PORT') === 465,
          auth: {
            user: configService.get('MAIL_SMTP_USER'),
            pass: configService.get('MAIL_SMTP_PASS'),
          },
        },
        defaults: {
          from: `"Arreglame Ya" <${configService.get('MAIL_FROM') || configService.get('MAIL_SMTP_USER')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
