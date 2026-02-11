import { InputType, Field, Int } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt, Min, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';

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

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: {
    description?: string;
  };
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

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  metadata?: {
    description?: string;
  };

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

  @Field(() => Int)
  @IsInt()
  @Min(0)
  experienceYears: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
}

@InputType()
export class SyncProfessionalServicesInput {
  @Field(() => [ServiceSelectionInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceSelectionInput)
  services: ServiceSelectionInput[];
}
