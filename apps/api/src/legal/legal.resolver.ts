
import { Resolver, Query, Mutation, Args, Context, ObjectType, Field } from '@nestjs/graphql';
import { LegalService } from './legal.service';
import { UseGuards } from '@nestjs/common';

@ObjectType('LegalDocument')
export class LegalDocumentResponse {
  @Field()
  id: string;

  @Field()
  version: string;

  @Field()
  content: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  role?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@Resolver()
export class LegalResolver {
  constructor(private legalService: LegalService) {}

  @Query(() => LegalDocumentResponse)
  async latestTerms(@Args('role') role: string): Promise<LegalDocumentResponse> {
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

  @Mutation(() => Boolean)
  async acceptLatestTerms(
    @Args('userId') userId: string,
    @Args('documentId') documentId: string,
    @Context() context: any
  ): Promise<boolean> {
    const ip = context.req?.ip || '0.0.0.0';
    const ua = context.req?.headers?.['user-agent'] || 'Unknown';

    await this.legalService.acceptTerms(userId, documentId, { ip, ua });
    return true;
  }
}
