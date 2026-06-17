import { Module } from '@nestjs/common';
import { HousePlannerService } from './house-planner.service';
import { HousePlannerController } from './house-planner.controller';
import { IncomeModule } from '../income/income.module';
import { SavingsModule } from '../savings/savings.module';

@Module({
  imports: [IncomeModule, SavingsModule],
  controllers: [HousePlannerController],
  providers: [HousePlannerService],
})
export class HousePlannerModule {}
