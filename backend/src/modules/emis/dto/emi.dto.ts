import { IsString, IsOptional, IsDateString, IsEnum, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmiPaymentStatus } from '@prisma/client';

export class RecordEmiDto {
  @ApiProperty()
  @IsDateString()
  paidDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class EmiFilterDto {
  @ApiPropertyOptional({ enum: EmiPaymentStatus })
  @IsOptional()
  @IsEnum(EmiPaymentStatus)
  status?: EmiPaymentStatus;

  @ApiPropertyOptional({ description: 'Days ahead to look for due EMIs' })
  @IsOptional()
  @IsInt()
  @Min(1)
  days?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  loanId?: string;
}
