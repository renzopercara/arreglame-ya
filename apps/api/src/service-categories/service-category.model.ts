import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

/**
 * ServiceCategoryGraphQL - GraphQL representation of ServiceCategory
 * 
 * Renamed to avoid collision with Prisma's ServiceCategory model.
 * This is a pure GraphQL type that mirrors the Prisma model structure.
 */
@ObjectType('ServiceCategory')
export class ServiceCategoryGraphQL {
  @Field(() => ID)
  id!: string;

  @Field()
  slug!: string;

  @Field()
  name!: string;

  @Field()
  iconName!: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Float)
  basePrice!: number;

  @Field(() => Float)
  hourlyRate!: number;

  @Field(() => Float)
  estimatedHours!: number;

  @Field()
  active!: boolean;
}
