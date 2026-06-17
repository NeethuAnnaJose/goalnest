import { IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportPeriod, ReportFormat } from '@prisma/client';

export class GenerateReportDto {
  @ApiProperty({ enum: ReportPeriod })
  @IsEnum(ReportPeriod)
  period: ReportPeriod;

  @ApiProperty({ enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
