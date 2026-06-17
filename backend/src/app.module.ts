import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { UsersModule } from './modules/users/users.module';
import { IncomeModule } from './modules/income/income.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { SavingsModule } from './modules/savings/savings.module';
import { GoalsModule } from './modules/goals/goals.module';
import { LoansModule } from './modules/loans/loans.module';
import { EmisModule } from './modules/emis/emis.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HousePlannerModule } from './modules/house-planner/house-planner.module';
import { AffordabilityModule } from './modules/affordability/affordability.module';
import { HealthScoreModule } from './modules/health-score/health-score.module';
import { AiCoachModule } from './modules/ai-coach/ai-coach.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BankImportModule } from './modules/bank-import/bank-import.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60', 10) * 1000,
        limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    IncomeModule,
    ExpensesModule,
    SavingsModule,
    GoalsModule,
    LoansModule,
    EmisModule,
    DashboardModule,
    HousePlannerModule,
    AffordabilityModule,
    HealthScoreModule,
    AiCoachModule,
    NotificationsModule,
    ReportsModule,
    BankImportModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
