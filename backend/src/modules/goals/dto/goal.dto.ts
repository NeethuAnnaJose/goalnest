import { IsEnum, IsString, IsOptional, IsDateString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalType } from '@prisma/client';

export class CreateGoalDto {
  @ApiProperty({ enum: GoalType })
  @IsEnum(GoalType)
  type: GoalType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ example: '500000.00' })
  @IsString()
  targetAmount: string;

  @ApiPropertyOptional({ example: '50000.00' })
  @IsOptional()
  @IsString()
  currentSavings?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateGoalDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '500000.00' })
  @IsOptional()
  @IsString()
  targetAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;
}

export class UpdateGoalProgressDto {
  @ApiProperty({ example: '10000.00' })
  @IsString()
  amount: string;
}
