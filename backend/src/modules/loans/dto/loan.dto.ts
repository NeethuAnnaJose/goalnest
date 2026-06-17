import { IsEnum, IsString, IsOptional, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LoanType } from '@prisma/client';

export class CreateLoanDto {
  @ApiProperty({ enum: LoanType })
  @IsEnum(LoanType)
  type: LoanType;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ example: '5000000.00' })
  @IsString()
  principal: string;

  @ApiProperty({ example: '8.5' })
  @IsString()
  interestRate: string;

  @ApiProperty()
  @IsInt()
  @Min(1)
  tenureMonths: number;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLoanDto {
  @ApiPropertyOptional({ enum: LoanType })
  @IsOptional()
  @IsEnum(LoanType)
  type?: LoanType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '5000000.00' })
  @IsOptional()
  @IsString()
  principal?: string;

  @ApiPropertyOptional({ example: '8.5' })
  @IsOptional()
  @IsString()
  interestRate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  tenureMonths?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RecordEmiPaymentDto {
  @ApiProperty()
  @IsDateString()
  paidDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
