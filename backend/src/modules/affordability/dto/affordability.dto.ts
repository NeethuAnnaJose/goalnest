import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AffordabilityDto {
  @ApiProperty({ example: 'iPhone 16 Pro' })
  @IsString()
  productName: string;

  @ApiProperty({ example: '150000.00' })
  @IsString()
  productCost: string;
}
