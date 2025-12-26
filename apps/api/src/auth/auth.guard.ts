
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

    try {
      // Verificar firma y expiraciÃƒ³n
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'CHANGE_THIS_SECRET_IN_PROD'
      });
      
      // Inyectar usuario en el request context
      request['user'] = payload;
      
      // Validar que el usuario siga existiendo en DB (opcional para extra seguridad)
      // const user = await (this.prisma as any).user.findUnique({ where: { id: payload.sub } });
      // if (!user) throw new UnauthorizedException('Usuario inexistente');

    } catch (e) {
      throw new UnauthorizedException('Token invÃƒ¡lido o expirado');
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
