import { IsEnum, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IncomeType, RecurrenceFrequency } from '@prisma/client';

export class CreateIncomeDto {
  @ApiProperty({ enum: IncomeType })
  @IsEnum(IncomeType)
  type: IncomeType;

  @ApiProperty({ example: '50000.00' })
  @IsString()
  amount: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional({ enum: RecurrenceFrequency })
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateIncomeDto {
  @ApiPropertyOptional({ enum: IncomeType })
  @IsOptional()
  @IsEnum(IncomeType)
  type?: IncomeType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  amount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEnum(RecurrenceFrequency)
  frequency?: RecurrenceFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
