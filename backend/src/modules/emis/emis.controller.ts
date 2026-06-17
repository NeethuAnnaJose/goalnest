import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EmisService } from './emis.service';
import { EmiFilterDto, RecordEmiDto } from './dto/emi.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('EMI Tracking')
@ApiBearerAuth()
@Controller('emis')
export class EmisController {
  constructor(private emisService: EmisService) {}

  @Get()
  @ApiOperation({ summary: 'List EMI payments with filters' })
  findAll(@CurrentUser('id') userId: string, @Query() filters: EmiFilterDto) {
    return this.emisService.findAll(userId, filters);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get EMI due alerts (7, 3, 1, 0 days)' })
  alerts(@CurrentUser('id') userId: string) {
    return this.emisService.getAlerts(userId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'EMI payment summary for a financial year' })
  summary(@CurrentUser('id') userId: string, @Query('fy') fy?: string) {
    return this.emisService.getFySummary(userId, fy);
  }

  @Get('tracker/:loanId')
  @ApiOperation({ summary: 'EMI tracker for a specific loan' })
  tracker(@CurrentUser('id') userId: string, @Param('loanId') loanId: string) {
    return this.emisService.getTracker(userId, loanId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.emisService.findOne(userId, id);
  }

  @Post(':id/pay')
  @ApiOperation({ summary: 'Record EMI payment' })
  pay(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: RecordEmiDto,
  ) {
    return this.emisService.recordPayment(userId, id, dto);
  }

  @Post(':id/unpay')
  @ApiOperation({ summary: 'Undo EMI payment (reverts remaining balance)' })
  unpay(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.emisService.unpayEmi(userId, id);
  }

  @Post(':id/missed')
  @ApiOperation({ summary: 'Mark EMI as missed' })
  missed(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.emisService.markMissed(userId, id);
  }
}
