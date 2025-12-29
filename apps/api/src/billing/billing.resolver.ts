import { Resolver, Mutation, Args, Context, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { MercadoPagoService } from './mercadopago.service';

@ObjectType('PaymentPreference')
export class PaymentPreferenceResponse {
  @Field()
  preferenceId: string;

  @Field()
  initPoint: string;
}

@Resolver()
export class BillingResolver {
  constructor(private mercadoPagoService: MercadoPagoService) {}

  @Mutation(() => PaymentPreferenceResponse)
  @UseGuards(AuthGuard)
  async createPaymentPreference(
    @Args('serviceRequestId') serviceRequestId: string,
    @Args('amount', { nullable: true }) amount: number,
    @Context() context: any,
  ): Promise<PaymentPreferenceResponse> {
    const userId = context.req.user?.id;
    
    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.mercadoPagoService.createPreference(serviceRequestId, amount, userId);
  }
}
