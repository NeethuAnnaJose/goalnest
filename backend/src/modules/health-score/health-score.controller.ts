import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HealthScoreService } from './health-score.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Financial Health Score')
@ApiBearerAuth()
@Controller('health-score')
export class HealthScoreController {
  constructor(private healthScoreService: HealthScoreService) {}

  @Get()
  @ApiOperation({ summary: 'Calculate financial health score (0-100)' })
  calculate(@CurrentUser('id') userId: string) {
    return this.healthScoreService.calculate(userId);
  }
}
