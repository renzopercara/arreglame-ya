import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class WorkerSpecialtyType {
  @Field()
  id: string;

  @Field()
  workerId: string;

  @Field()
  categoryId: string;

  @Field()
  status: string;

  @Field(() => Int)
  experienceYears: number;

  @Field({ nullable: true })
  metadata?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations
  @Field({ nullable: true })
  category?: ServiceCategoryType;
}

@ObjectType()
export class ServiceCategoryType {
  @Field()
  id: string;

  @Field()
  slug: string;

  @Field()
  name: string;

  @Field()
  iconName: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  basePrice: number;

  @Field()
  hourlyRate: number;

  @Field()
  estimatedHours: number;

  @Field()
  active: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
