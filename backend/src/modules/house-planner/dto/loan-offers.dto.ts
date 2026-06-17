import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoanOffersDto {
  @ApiProperty({ example: 'HOUSE', enum: ['HOUSE', 'CAR'] })
  @IsString()
  @IsIn(['HOUSE', 'CAR'])
  loanType: 'HOUSE' | 'CAR';

  @ApiProperty({ example: '4000000.00' })
  @IsString()
  loanAmount: string;

  @ApiProperty({ example: '8.5', description: 'Your current interest rate for comparison' })
  @IsString()
  currentInterestRate: string;

  @ApiProperty({ example: '35000.00' })
  @IsString()
  monthlyPayment: string;
}
