import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class BankImportOptionsDto {
  @ApiPropertyOptional({ description: 'Parse only without saving to database', default: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  preview?: boolean;
}

export class BankImportResultDto {
  @ApiProperty()
  fileType: 'csv' | 'xlsx' | 'pdf';

  @ApiProperty()
  totalParsed: number;

  @ApiProperty()
  expensesImported: number;

  @ApiProperty()
  incomeImported: number;

  @ApiProperty()
  skipped: number;

  @ApiProperty()
  categoryBreakdown: Record<string, number>;
}
