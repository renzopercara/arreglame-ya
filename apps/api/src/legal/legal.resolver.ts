
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { LegalService } from './legal.service';
import { UseGuards } from '@nestjs/common';

@Resolver('LegalDocument')
export class LegalResolver {
  constructor(private legalService: LegalService) {}

  @Query()
  async latestTerms(@Args('role') role: string) {
    const doc = await this.legalService.getActiveDocument(role as 'CLIENT' | 'WORKER');
    if (!doc) {
        // Fallback si no hay DB seed
        return {
            id: 'default',
            version: '1.0-fallback',
            content: '# TÃƒ©rminos y Condiciones\n\nCargando...',
            isActive: true
        };
    }
    return doc;
  }

  @Mutation()
  async acceptLatestTerms(
    @Args('userId') userId: string,
    @Args('documentId') documentId: string,
    @Context() context: any
  ) {
    const ip = context.req?.ip || '0.0.0.0';
    const ua = context.req?.headers?.['user-agent'] || 'Unknown';

    await this.legalService.acceptTerms(userId, documentId, { ip, ua });
    return true;
  }
}
