import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SavingsService } from './savings.service';
import {
  CreateSavingsDto,
  UpdateSavingsDto,
  SavingsDepositDto,
  SavingsContributionDto,
} from './dto/savings.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Savings')
@ApiBearerAuth()
@Controller('savings')
export class SavingsController {
  constructor(private savingsService: SavingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create savings account' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSavingsDto) {
    return this.savingsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all savings accounts' })
  findAll(@CurrentUser('id') userId: string) {
    return this.savingsService.findAll(userId);
  }

  @Get('growth')
  @ApiOperation({ summary: 'Monthly and yearly savings growth stats' })
  growth(@CurrentUser('id') userId: string, @Query('fy') fy?: string) {
    return this.savingsService.getGrowthStats(userId, fy);
  }

  @Get('contributions')
  @ApiOperation({ summary: 'List monthly savings contributions for a financial year' })
  contributions(
    @CurrentUser('id') userId: string,
    @Query('fy') fy?: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.savingsService.listContributions(userId, fy, accountId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savingsService.findOne(userId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSavingsDto,
  ) {
    return this.savingsService.update(userId, id, dto);
  }

  @Post(':id/deposit')
  @ApiOperation({ summary: 'Add funds to savings account' })
  deposit(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SavingsDepositDto,
  ) {
    return this.savingsService.deposit(userId, id, dto);
  }

  @Post(':id/contributions')
  @ApiOperation({ summary: 'Mark a month as saved (adds monthly debit to balance)' })
  recordContribution(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: SavingsContributionDto,
  ) {
    return this.savingsService.recordContribution(userId, id, dto);
  }

  @Delete(':id/contributions/:month')
  @ApiOperation({ summary: 'Unmark a month as saved (removes amount from balance)' })
  removeContribution(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Param('month') month: string,
  ) {
    return this.savingsService.removeContribution(userId, id, month);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.savingsService.remove(userId, id);
  }
}
