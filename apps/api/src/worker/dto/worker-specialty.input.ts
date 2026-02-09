import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsEnum } from 'class-validator';

export enum SpecialtyStatusInput {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
}

@InputType()
export class CreateWorkerSpecialtyInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  experienceYears: number = 0;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  metadata?: string; // JSON string for certifications, specific skills, etc.
}

@InputType()
export class UpdateWorkerSpecialtyInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  experienceYears?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  metadata?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsEnum(SpecialtyStatusInput)
  status?: SpecialtyStatusInput;
}

@InputType()
export class AddMultipleSpecialtiesInput {
  @Field(() => [CreateWorkerSpecialtyInput])
  specialties: CreateWorkerSpecialtyInput[];
}

@InputType()
export class ServiceSelectionInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @Field(() => Int, { defaultValue: 0 })
  @IsInt()
  @Min(0)
  experienceYears: number = 0;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string; // Brief description of how the professional does this service
}

@InputType()
export class SyncProfessionalServicesInput {
  @Field(() => [ServiceSelectionInput])
  services: ServiceSelectionInput[];
}
