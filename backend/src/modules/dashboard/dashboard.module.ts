import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { IncomeModule } from '../income/income.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { LoansModule } from '../loans/loans.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [IncomeModule, ExpensesModule, LoansModule, GoalsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
