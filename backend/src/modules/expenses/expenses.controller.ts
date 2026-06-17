import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  BulkImportExpenseDto,
  ExpenseFilterDto,
  UpdateExpenseDto,
  CsvImportExpenseDto,
} from './dto/expense.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(userId, dto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk import expenses' })
  bulkImport(@CurrentUser('id') userId: string, @Body() dto: BulkImportExpenseDto) {
    return this.expensesService.bulkImport(userId, dto);
  }

  @Post('import/csv')
  @ApiOperation({ summary: 'Import expenses from CSV' })
  importCsv(@CurrentUser('id') userId: string, @Body() dto: CsvImportExpenseDto) {
    return this.expensesService.importCsv(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string, @Query() filters: ExpenseFilterDto) {
    return this.expensesService.findAll(userId, filters);
  }

  @Get('breakdown')
  @ApiOperation({ summary: 'Category breakdown for month' })
  breakdown(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('fy') fy?: string,
  ) {
    return this.expensesService.getCategoryBreakdown(userId, month, fy);
  }

  @Get('overspending')
  @ApiOperation({ summary: 'Detect overspending patterns' })
  overspending(@CurrentUser('id') userId: string) {
    return this.expensesService.detectOverspending(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.expensesService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update expense entry' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.expensesService.remove(userId, id);
  }
}
