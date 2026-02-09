import { ObjectType, Field } from '@nestjs/graphql';

/**
 * Service Type - Represents a service/activity offered by a worker
 * This is an alias/view of WorkerSpecialty for frontend clarity
 */
@ObjectType()
export class Service {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  iconName: string;

  @Field()
  isActive: boolean;

  @Field({ nullable: true })
  experienceYears?: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
