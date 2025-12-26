
import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LegalService } from '../legal/legal.service';
import { LoginInput, RegisterInput } from './dto/auth.input';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private legalService: LegalService
  ) {}

  @Mutation('login')
  async login(@Args('input') input: LoginInput) {
    const { accessToken, user } = await this.authService.login(input.email, input.password, input.role);
    const hasAccepted = await this.legalService.hasAcceptedLatest(user.id, user.role as 'CLIENT' | 'WORKER');

    return {
      accessToken,
      user: {
        ...user,
        mustAcceptTerms: !hasAccepted
      }
    };
  }

  @Mutation('register')
  async register(
    @Args('input') input: RegisterInput,
    @Context() context: any
  ) {
    const { accessToken, user } = await this.authService.register(input.email, input.password, input.name, input.role);

    if (input.termsAccepted) {
       const activeDoc = await this.legalService.getActiveDocument(input.role as 'CLIENT' | 'WORKER');
       if (activeDoc) {
           const ip = context?.req?.ip || '0.0.0.0';
           await this.legalService.acceptTerms(user.id, activeDoc.id, { 
               ip, 
               ua: input.userAgent || 'Registration-Flow' 
           });
       }
    }

    const hasAccepted = await this.legalService.hasAcceptedLatest(user.id, input.role as 'CLIENT' | 'WORKER');

    return {
      accessToken,
      user: {
        ...user,
        mustAcceptTerms: !hasAccepted
      }
    };
  }

  @Query('me')
  async me(@Context() context: any) {
    const userId = context.req?.user?.id;
    if (!userId) return null;

    const user = await this.authService.findUserById(userId);
    if (!user) return null;

    const hasAccepted = await this.legalService.hasAcceptedLatest(user.id, user.role as 'CLIENT' | 'WORKER');

    return {
        ...user,
        mustAcceptTerms: !hasAccepted
    };
  }
}
