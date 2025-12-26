
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';

export class EstimateJobInput {
  @IsString()
  @IsNotEmpty()
  image: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(1)
  squareMeters: number;

  @IsOptional()
  @IsBoolean()
  hasHighWeeds?: boolean;

  @IsOptional()
  @IsBoolean()
  hasSlope?: boolean;

  @IsOptional()
  @IsBoolean()
  complicatedAccess?: boolean;
}
