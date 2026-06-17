import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { IncomeService } from '../income/income.service';

import { SavingsService } from '../savings/savings.service';

import { HousePlannerDto } from './dto/house-planner.dto';

import { LoanOffersDto } from './dto/loan-offers.dto';

import { calculateHousePlanner, calculateRemainingMonths } from '../../common/utils/emi.util';

import { toMinorUnits, fromMinorUnits } from '../../common/utils/money.util';

import { BANK_LOAN_OFFERS, LoanOfferCategory } from '../../common/data/loan-offers.data';



@Injectable()

export class HousePlannerService {

  constructor(

    private prisma: PrismaService,

    private incomeService: IncomeService,

    private savingsService: SavingsService,

  ) {}



  async plan(userId: string, dto: HousePlannerDto) {

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const currency = user?.currency ?? 'INR';



    const savingsAccounts = await this.savingsService.findAll(userId);

    const currentSavings = savingsAccounts.reduce((s, a) => s + a.balance, 0n);



    const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const incomes = await this.incomeService.findAll(userId, month);

    const monthlyIncome =

      incomes.reduce((s, i) => s + i.amount, 0n) || user?.monthlySalary || 0n;



    const result = calculateHousePlanner({

      propertyPrice: toMinorUnits(dto.propertyPrice, currency),

      downPaymentPercent: dto.downPaymentPercent,

      annualInterestRate: dto.interestRate,

      monthlyPayment: toMinorUnits(dto.monthlyPayment, currency),

      currentSavings,

      monthlyIncome,

      currency,

    });



    return {

      ...result,

      formatted: {

        requiredDownPayment: result.requiredDownPaymentMajor,

        monthlyEmi: result.monthlyEmiMajor,

        loanAmount: result.loanAmountMajor,

        totalInterest: result.totalInterestMajor,

        monthlySavingsNeeded: fromMinorUnits(result.monthlySavingsNeeded, currency),

        tenureMonths: result.tenureMonths,

        tenureYears: Math.round((result.tenureMonths / 12) * 10) / 10,

      },

      inputs: dto,

    };

  }



  async getLoanOffers(userId: string, dto: LoanOffersDto) {

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    const currency = user?.currency ?? 'INR';

    const category: LoanOfferCategory = dto.loanType === 'HOUSE' ? 'HOME' : 'VEHICLE';

    const currentRate = Number(dto.currentInterestRate);

    const loanAmount = toMinorUnits(dto.loanAmount, currency);

    const monthlyPayment = toMinorUnits(dto.monthlyPayment, currency);



    const currentTenure = calculateRemainingMonths({

      remainingBalance: loanAmount,

      emiAmount: monthlyPayment,

      annualInterestRate: currentRate,

    });

    const currentTotalInterest = monthlyPayment * BigInt(currentTenure) - loanAmount;



    const offers = BANK_LOAN_OFFERS

      .filter((bank) => bank.loanTypes.includes(category) && bank.interestRate < currentRate)

      .sort((a, b) => a.interestRate - b.interestRate)

      .map((bank) => {

        const tenureMonths = calculateRemainingMonths({

          remainingBalance: loanAmount,

          emiAmount: monthlyPayment,

          annualInterestRate: bank.interestRate,

        });

        const totalInterest = monthlyPayment * BigInt(tenureMonths) - loanAmount;

        const interestSavings = currentTotalInterest - totalInterest;



        return {

          bankName: bank.bankName,

          interestRate: bank.interestRate,

          processingFee: bank.processingFee,

          highlights: bank.highlights,

          tenureMonths,

          tenureYears: Math.round((tenureMonths / 12) * 10) / 10,

          formatted: {

            totalInterest: fromMinorUnits(totalInterest, currency),

            interestSavings: fromMinorUnits(interestSavings > 0n ? interestSavings : 0n, currency),

            monthlyPayment: fromMinorUnits(monthlyPayment, currency),

          },

        };

      });



    return {

      loanType: dto.loanType,

      currentRate,

      offers,

      allBanks: BANK_LOAN_OFFERS

        .filter((bank) => bank.loanTypes.includes(category))

        .sort((a, b) => a.interestRate - b.interestRate)

        .map((bank) => ({

          bankName: bank.bankName,

          interestRate: bank.interestRate,

          isLowerThanCurrent: bank.interestRate < currentRate,

        })),

    };

  }

}

