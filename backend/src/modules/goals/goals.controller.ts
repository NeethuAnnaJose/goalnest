import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { CreateGoalDto, UpdateGoalDto, UpdateGoalProgressDto } from './dto/goal.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Goals')
@ApiBearerAuth()
@Controller('goals')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Post()
  create(@CurrentUser('id') userId: string, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(userId, dto);
  }

  @Get()
  findAll(@CurrentUser('id') userId: string) {
    return this.goalsService.findAll(userId);
  }

  @Get(':id')
  findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.goalsService.findOne(userId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update goal details' })
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalDto,
  ) {
    return this.goalsService.update(userId, id, dto);
  }

  @Put(':id/progress')
  @ApiOperation({ summary: 'Add savings toward goal' })
  updateProgress(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateGoalProgressDto,
  ) {
    return this.goalsService.updateProgress(userId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.goalsService.remove(userId, id);
  }
}
