import { Module } from '@nestjs/common';
import { AiCoachService } from './ai-coach.service';
import { AiCoachController } from './ai-coach.controller';
import { OpenAiService } from './openai.service';
import { FinancialContextService } from './financial-context.service';
import { ExpensesModule } from '../expenses/expenses.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [ExpensesModule, GoalsModule],
  controllers: [AiCoachController],
  providers: [AiCoachService, OpenAiService, FinancialContextService],
  exports: [AiCoachService, OpenAiService],
})
export class AiCoachModule {}
