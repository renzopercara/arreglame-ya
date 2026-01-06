import { ObjectType, Field, ID, Float } from '@nestjs/graphql';

/**
 * ServiceCategory GraphQL ObjectType
 * Represents a service category with pricing information
 */
@ObjectType()
export class ServiceCategory {
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

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
