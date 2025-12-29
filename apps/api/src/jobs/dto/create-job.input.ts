
import { IsNotEmpty, IsString, IsNumber, IsUUID, Min, IsOptional, IsBoolean } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateJobInput {
  @Field()
  @IsUUID()
  clientId: string;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @Field()
  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  address?: string; // Full address for geocoding

  @Field()
  @IsString()
  @IsNotEmpty()
  image: string; // Base64

  @Field({ nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field()
  @IsNumber()
  @Min(0)
  difficulty: number;

  @Field()
  @IsNumber()
  @Min(0.5)
  estimatedHours: number;

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
  @IsString()
  scheduledFor?: string;
}
