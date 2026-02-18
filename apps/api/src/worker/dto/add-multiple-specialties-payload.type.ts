import { ObjectType, Field } from '@nestjs/graphql';
import { WorkerSpecialtyType } from './worker-specialty.type';

@ObjectType('AddMultipleWorkerSpecialtiesPayload')
export class AddMultipleWorkerSpecialtiesPayload {
  @Field()
  success: boolean;

  @Field(() => [WorkerSpecialtyType])
  specialties: WorkerSpecialtyType[];

  @Field({ nullable: true })
  categoryId?: string;

  @Field({ nullable: true })
  error?: string;
}
