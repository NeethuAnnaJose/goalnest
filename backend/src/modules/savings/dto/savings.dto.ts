import { IsEnum, IsString, IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SavingsType } from '@prisma/client';

export class CreateSavingsDto {
  @ApiProperty({ enum: SavingsType })
  @IsEnum(SavingsType)
  type: SavingsType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ example: '100000.00' })
  @IsString()
  balance: string;

  @ApiPropertyOptional({ example: '6.5' })
  @IsOptional()
  @IsString()
  interestRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  maturityDate?: string;
}

export class UpdateSavingsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  balance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  interestRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  institution?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  maturityDate?: string;

  @ApiPropertyOptional({ example: '5000.00', description: 'Monthly auto-debit amount for savings tracking' })
  @IsOptional()
  @IsString()
  monthlyDebitAmount?: string;

  @ApiPropertyOptional({ example: 5, description: 'Day of month when debit is due (1-28)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  debitDayOfMonth?: number;
}

export class SavingsContributionDto {
  @ApiProperty({ example: '2025-06', description: 'Month key YYYY-MM' })
  @IsString()
  month: string;

  @ApiPropertyOptional({ example: '5000.00', description: 'Override account monthly debit amount' })
  @IsOptional()
  @IsString()
  amount?: string;
}

export class SavingsDepositDto {
  @ApiProperty({ example: '5000.00' })
  @IsString()
  amount: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
