import { Controller, Get, Post, Delete, Param, Body, Header, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { GenerateReportDto } from './dto/report.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate financial report (PDF/Excel/CSV)' })
  generate(@CurrentUser('id') userId: string, @Body() dto: GenerateReportDto) {
    return this.reportsService.generate(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List generated reports' })
  findAll(@CurrentUser('id') userId: string) {
    return this.reportsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get report details' })
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reportsService.findOne(userId, id);
  }

  @Get(':id/export/csv')
  @ApiOperation({ summary: 'Download report as CSV' })
  @Header('Content-Type', 'text/csv')
  exportCsv(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reportsService.exportCsv(userId, id);
  }

  @Get(':id/export/excel')
  @ApiOperation({ summary: 'Download report as styled Excel' })
  async exportExcel(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buffer = await this.reportsService.exportExcel(userId, id);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="goalnest-report-${id.slice(0, 8)}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete report' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.reportsService.delete(userId, id);
  }
}
