import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ServiceCategoryGraphQL } from '../../service-categories/service-category.model';

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

  // Relations - using lazy type resolution (arrow function) to avoid circular dependency
  @Field(() => ServiceCategoryGraphQL, { nullable: true })
  category?: ServiceCategoryGraphQL;
}
