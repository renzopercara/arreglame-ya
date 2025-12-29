
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class EstimateJobInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  image: string;

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsNumber()
  @Min(1)
  squareMeters: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasHighWeeds?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasSlope?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  complicatedAccess?: boolean;
}
