import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LoansService } from './loans.service';
import { CreateLoanDto, UpdateLoanDto, RecordEmiPaymentDto } from './dto/loan.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Loans')
@ApiBearerAuth()
@Controller('loans')
export class LoansController {
  constructor(private loansService: LoansService) {}

  @Post()
  @ApiOperation({ summary: 'Create loan with auto EMI schedule' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateLoanDto) {
    return this.loansService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.loansService.findAll(userId);
  }

  @Get('upcoming-emis')
  @ApiOperation({ summary: 'Get upcoming EMI payments' })
  upcomingEmis(@CurrentUser('id') userId: string, @Query('days') days?: number) {
    return this.loansService.getUpcomingEmis(userId, days ? Number(days) : 30);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.loansService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update loan details' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLoanDto,
  ) {
    return this.loansService.update(userId, id, dto);
  }

  @Post(':loanId/emis/:emiId/pay')
  @ApiOperation({ summary: 'Record EMI payment' })
  recordPayment(
    @CurrentUser('id') userId: string,
    @Param('loanId') loanId: string,
    @Param('emiId') emiId: string,
    @Body() dto: RecordEmiPaymentDto,
  ) {
    return this.loansService.recordEmiPayment(userId, loanId, emiId, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.loansService.remove(userId, id);
  }
}
