import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum InsightPeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
}

export class GetInsightsQueryDto {
  @ApiPropertyOptional({ enum: InsightPeriod })
  @IsOptional()
  @IsEnum(InsightPeriod)
  period?: InsightPeriod;

  @ApiPropertyOptional({ description: 'Filter by category: overspending, goals, report, insight' })
  @IsOptional()
  @IsString()
  category?: string;
}

export interface GeneratedInsightItem {
  title: string;
  content: string;
  category: string;
  severity: 'info' | 'warning' | 'success' | 'critical';
}

export interface OpenAiInsightResponse {
  insights: GeneratedInsightItem[];
  summary?: string;
}
