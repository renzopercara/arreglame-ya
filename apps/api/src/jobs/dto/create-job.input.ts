
import { IsNotEmpty, IsString, IsNumber, IsUUID, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreateJobInput {
  @IsUUID()
  clientId: string;

  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @IsString()
  @IsNotEmpty()
  image: string; // Base64

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  difficulty: number;

  @IsNumber()
  @Min(0.5)
  estimatedHours: number;

  @IsNumber()
  @Min(1)
  squareMeters: number;

  @IsOptional()
  @IsBoolean()
  hasHighWeeds?: boolean;

  @IsOptional()
  @IsString()
  scheduledFor?: string;
}
