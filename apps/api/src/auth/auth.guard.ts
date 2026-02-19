
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
      private jwtService: JwtService,
      private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;
    
    // Obtener token del header Authorization
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    // Verify signature and expiration
    let payload: Record<string, unknown>;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PROD'
      });
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    if (typeof payload.sub !== 'string' || !payload.sub) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    // Hydrate request.user with fresh data from DB so roles are never stale
    const dbUser = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { roles: true, currentRole: true, activeRole: true, isEmailVerified: true },
    });

    if (!dbUser) {
      throw new UnauthorizedException('Usuario inexistente');
    }

    // Merge JWT payload with fresh DB fields; DB values take precedence for authorization
    request['user'] = {
      ...payload,
      roles: dbUser.roles,
      currentRole: dbUser.currentRole,
      activeRole: dbUser.activeRole,
      isEmailVerified: dbUser.isEmailVerified,
    };
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
