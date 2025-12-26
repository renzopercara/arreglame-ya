
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaService } from '../prisma/prisma.service';
import { LegalModule } from '../legal/legal.module';
import { AuthGuard } from './auth.guard';

@Module({
  imports: [
    LegalModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PROD',
      signOptions: { expiresIn: '30d' }, // MVP: Larga duraciÃƒ³n para evitar refresh token logic complejo
    }),
  ],
  providers: [AuthService, AuthResolver, PrismaService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
