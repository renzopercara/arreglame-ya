
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService
  ) {}

  private hashPassword(password: string): string {
    return createHash('sha256').update(password).digest('hex');
  }

  async login(email: string, password: string, role: string) {
    const user = await (this.prisma as any).user.findUnique({
      where: { email },
    });

    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new UnauthorizedException('Credenciales invÃƒ¡lidas');
    }

    if (user.role !== role) {
        throw new UnauthorizedException(`Este usuario no tiene el rol de ${role}`);
    }

    // JWT Payload seguro
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, user };
  }

  async register(email: string, password: string, name: string, role: string) {
    const existing = await (this.prisma as any).user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('El email ya estÃƒ¡ registrado');

    const passwordHash = this.hashPassword(password);

    const user = await (this.prisma as any).$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
            data: {
                email,
                passwordHash,
                role,
                status: 'LOGGED_IN'
            }
        });

        if (role === 'CLIENT') {
            await tx.clientProfile.create({
                data: { userId: newUser.id, name }
            });
        } else if (role === 'WORKER') {
            await tx.workerProfile.create({
                data: { userId: newUser.id, name }
            });
        }

        return newUser;
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload);

    return { accessToken, user };
  }

  async findUserById(id: string) {
    return (this.prisma as any).user.findUnique({ where: { id } });
  }
}
