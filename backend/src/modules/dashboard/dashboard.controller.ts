import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get dashboard overview' })
  getDashboard(@CurrentUser('id') userId: string, @Query('fy') fy?: string) {
    return this.dashboardService.getDashboard(userId, fy);
  }

  @Post('tools/house-planner')
  @ApiOperation({ summary: 'House buying planner' })
  housePlanner(
    @CurrentUser('id') userId: string,
    @Body() body: { propertyPrice: string; downPaymentPercent: string; interestRate: string; monthlyPayment: string },
  ) {
    return this.dashboardService.housePlanner(userId, body);
  }

  @Post('tools/affordability')
  @ApiOperation({ summary: 'Can I afford this?' })
  affordability(
    @CurrentUser('id') userId: string,
    @Body() body: { productName: string; productCost: string },
  ) {
    return this.dashboardService.affordabilityCheck(userId, body.productName, body.productCost);
  }

  @Post('tools/wealth-simulator')
  @ApiOperation({ summary: 'Future wealth projection' })
  wealthSimulator(
    @CurrentUser('id') userId: string,
    @Body() body: { monthlySavings: string; annualIncrease: string; annualReturn: string; years: number },
  ) {
    return this.dashboardService.wealthSimulator(userId, body);
  }

  @Get('tools/emergency-fund')
  @ApiOperation({ summary: 'Emergency fund status' })
  emergencyFund(@CurrentUser('id') userId: string) {
    return this.dashboardService.emergencyFundStatus(userId);
  }
}
