import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class HousePlannerDto {
  @ApiProperty({ example: '5000000.00' })
  @IsString()
  propertyPrice: string;

  @ApiProperty({ example: '20', description: 'Down payment percentage' })
  @IsString()
  downPaymentPercent: string;

  @ApiProperty({ example: '8.5', description: 'Annual interest rate' })
  @IsString()
  interestRate: string;

  @ApiProperty({ example: '35000.00', description: 'Monthly EMI you can afford' })
  @IsString()
  monthlyPayment: string;
}
