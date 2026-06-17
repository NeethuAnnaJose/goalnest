import { Module } from '@nestjs/common';
import { AffordabilityService } from './affordability.service';
import { AffordabilityController } from './affordability.controller';
import { IncomeModule } from '../income/income.module';
import { ExpensesModule } from '../expenses/expenses.module';
import { SavingsModule } from '../savings/savings.module';
import { GoalsModule } from '../goals/goals.module';

@Module({
  imports: [IncomeModule, ExpensesModule, SavingsModule, GoalsModule],
  controllers: [AffordabilityController],
  providers: [AffordabilityService],
})
export class AffordabilityModule {}
