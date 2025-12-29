
import { IsString, IsNotEmpty } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SubmitKYCInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  dniFront: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  dniBack: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  insuranceDoc: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  selfie: string;
}
