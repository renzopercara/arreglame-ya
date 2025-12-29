
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { LegalModule } from '../legal/legal.module';
import { AuthGuard } from './auth.guard';
import { MailModule } from '../mail/mail.module';
import { UserEventsListener } from './events/user-events.listener';

@Module({
  imports: [
    LegalModule,
    MailModule,
    EventEmitterModule.forRoot(),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PROD',
      signOptions: { expiresIn: '30d' }, // MVP: Larga duraciÃƒ³n para evitar refresh token logic complejo
    }),
  ],
  providers: [AuthService, AuthResolver, PrismaService, AuthGuard, UserEventsListener],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}

