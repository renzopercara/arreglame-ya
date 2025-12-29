
import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class LoginInput {
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
  role: string;
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

  @Field()
  @IsString()
  @IsNotEmpty()
  role: string;

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
