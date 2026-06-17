import { IsString, IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MaritalStatus, SalaryFrequency } from '@prisma/client';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  monthlySalary?: string;

  @ApiPropertyOptional({ enum: SalaryFrequency })
  @IsOptional()
  @IsEnum(SalaryFrequency)
  salaryFrequency?: SalaryFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  financialDependents?: number;

  @ApiPropertyOptional({ enum: MaritalStatus })
  @IsOptional()
  @IsEnum(MaritalStatus)
  maritalStatus?: MaritalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  financialPreferences?: Record<string, unknown>;
}
