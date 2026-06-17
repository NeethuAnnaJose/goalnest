import { Module } from '@nestjs/common';
import { HealthScoreService } from './health-score.service';
import { HealthScoreController } from './health-score.controller';
import { IncomeModule } from '../income/income.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { GoalsModule } from '../goals/goals.module';
import { SavingsModule } from '../savings/savings.module';

@Module({
  imports: [IncomeModule, ExpensesModule, GoalsModule, SavingsModule],
  controllers: [HealthScoreController],
  providers: [HealthScoreService],
})
export class HealthScoreModule {}
