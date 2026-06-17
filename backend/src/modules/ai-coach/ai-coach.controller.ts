import { Controller, Get, Post, Put, Param, Query } from '@nestjs/common';

import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { AiCoachService } from './ai-coach.service';

import { GetInsightsQueryDto } from './dto/ai-insight.dto';

import { CurrentUser } from '../auth/decorators/current-user.decorator';



@ApiTags('Insights')

@ApiBearerAuth()

@Controller('ai-insights')

export class AiCoachController {

  constructor(private aiCoachService: AiCoachService) {}



  @Get()

  @ApiOperation({ summary: 'Get money notes and spending insights' })

  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly'] })

  @ApiQuery({ name: 'category', required: false, enum: ['insight', 'overspending', 'goals', 'report'] })

  getInsights(@CurrentUser('id') userId: string, @Query() query: GetInsightsQueryDto) {

    return this.aiCoachService.getInsights(userId, query.period, query.category);

  }



  @Post('daily')

  @ApiOperation({ summary: 'Generate daily money notes' })

  generateDaily(@CurrentUser('id') userId: string) {

    return this.aiCoachService.generateDailyInsights(userId);

  }



  @Post('weekly')

  @ApiOperation({ summary: 'Generate weekly financial summary' })

  generateWeekly(@CurrentUser('id') userId: string) {

    return this.aiCoachService.generateWeeklyReport(userId);

  }



  @Post('monthly')

  @ApiOperation({ summary: 'Generate monthly financial summary' })

  generateMonthly(@CurrentUser('id') userId: string) {

    return this.aiCoachService.generateMonthlyReport(userId);

  }



  @Post('overspending')

  @ApiOperation({ summary: 'Detect overspending patterns' })

  detectOverspending(@CurrentUser('id') userId: string) {

    return this.aiCoachService.detectOverspending(userId);

  }



  @Post('goal-recommendations')

  @ApiOperation({ summary: 'Generate goal progress notes' })

  goalRecommendations(@CurrentUser('id') userId: string) {

    return this.aiCoachService.generateGoalRecommendations(userId);

  }



  @Put(':id/read')

  @ApiOperation({ summary: 'Mark insight as read' })

  markRead(@CurrentUser('id') userId: string, @Param('id') id: string) {

    return this.aiCoachService.markInsightRead(userId, id);

  }

}

