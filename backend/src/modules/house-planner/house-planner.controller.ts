import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HousePlannerService } from './house-planner.service';
import { HousePlannerDto } from './dto/house-planner.dto';
import { LoanOffersDto } from './dto/loan-offers.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('House Planner')
@ApiBearerAuth()
@Controller('house-planner')
export class HousePlannerController {
  constructor(private housePlannerService: HousePlannerService) {}

  @Post()
  @ApiOperation({ summary: 'Calculate goal plan from monthly payment derives loan tenure' })
  plan(@CurrentUser('id') userId: string, @Body() dto: HousePlannerDto) {
    return this.housePlannerService.plan(userId, dto);
  }

  @Post('loan-offers')
  @ApiOperation({ summary: 'Find banks offering lower interest rates for your loan' })
  loanOffers(@CurrentUser('id') userId: string, @Body() dto: LoanOffersDto) {
    return this.housePlannerService.getLoanOffers(userId, dto);
  }
}
