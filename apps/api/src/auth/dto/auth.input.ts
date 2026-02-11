
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';
import { UserRole, ActiveRole } from '@prisma/client';

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}

@InputType()
export class RegisterInput {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  termsAccepted?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  termsVersion?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  termsDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

@InputType()
export class BecomeWorkerInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  bio?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  trade?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  selfieImage?: string;

  @Field()
  @IsBoolean()
  termsAccepted: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  termsVersion?: string;
}
