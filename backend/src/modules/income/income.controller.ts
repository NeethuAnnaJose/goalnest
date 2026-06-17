import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IncomeService } from './income.service';
import { CreateIncomeDto, UpdateIncomeDto } from './dto/income.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Income')
@ApiBearerAuth()
@Controller('income')
export class IncomeController {
  constructor(private incomeService: IncomeService) {}

  @Post()
  @ApiOperation({ summary: 'Add income entry' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateIncomeDto) {
    return this.incomeService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List income entries' })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('month') month?: string,
    @Query('fy') fy?: string,
  ) {
    return this.incomeService.findAll(userId, month, fy);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.incomeService.findOne(userId, id);
  }

  @Put(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    return this.incomeService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.incomeService.remove(userId, id);
  }
}
