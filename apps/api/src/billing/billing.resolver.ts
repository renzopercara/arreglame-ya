import { Resolver, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
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
    @CurrentUser() user: any,
  ): Promise<PaymentPreferenceResponse> {
    if (!user?.sub) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.mercadoPagoService.createPreference(serviceRequestId, amount, user.sub);
  }
}
