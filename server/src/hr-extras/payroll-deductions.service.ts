import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DeductionBreakdown {
  pension: number;
  nhis: number;
  leaveDeduction: number;
  loanRepayment: number;
  otherDeductions: number;
  total: number;
}

interface AllowanceBreakdown {
  housing: number;
  transport: number;
  meal: number;
  entertainment: number;
  otherAllowances: number;
  total: number;
}

@Injectable()
export class PayrollDeductionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate all deductions for an employee
   */
  async calculateDeductions(
    employeeId: string,
    grossPay: number,
    leaveDays: number = 0,
  ): Promise<DeductionBreakdown> {
    // Pension: 8% of gross pay (employee contribution)
    const pension = grossPay * 0.08;

    // NHIS: 5% of gross pay
    const nhis = grossPay * 0.05;

    // Leave deduction: proportional to leave days taken
    const leaveDeduction = await this.calculateLeaveDeduction(
      employeeId,
      grossPay,
      leaveDays,
    );

    // Loan repayment (if any active loan)
    const loanRepayment = await this.calculateLoanRepayment(employeeId);

    // Other deductions (can be customized per company)
    const otherDeductions = await this.getOtherDeductions(employeeId);

    const total = pension + nhis + leaveDeduction + loanRepayment + otherDeductions;

    return {
      pension: Math.round(pension),
      nhis: Math.round(nhis),
      leaveDeduction: Math.round(leaveDeduction),
      loanRepayment: Math.round(loanRepayment),
      otherDeductions: Math.round(otherDeductions),
      total: Math.round(total),
    };
  }

  /**
   * Calculate leave deduction (unpaid leave)
   * Formula: (Gross Pay / Working days in month) * Unpaid leave days
   */
  private async calculateLeaveDeduction(
    employeeId: string,
    grossPay: number,
    leaveDays: number,
  ): Promise<number> {
    if (leaveDays <= 0) return 0;

    const leaveType = await this.prisma.leaveType.findFirst({
      where: { paid: false },
    });

    if (!leaveType) {
      // Default to unpaid if no unpaid leave type exists
      const workingDaysPerMonth = 22; // Standard
      return (grossPay / workingDaysPerMonth) * leaveDays;
    }

    const workingDaysPerMonth = 22;
    return (grossPay / workingDaysPerMonth) * leaveDays;
  }

  /**
   * Calculate loan repayment deduction
   */
  private async calculateLoanRepayment(employeeId: string): Promise<number> {
    // This would come from a Loans table (not yet in schema)
    // For now, return 0
    return 0;
  }

  /**
   * Get other company-specific deductions
   */
  private async getOtherDeductions(employeeId: string): Promise<number> {
    // Can be extended to support custom deductions
    // For now, return 0
    return 0;
  }

  /**
   * Calculate all allowances for an employee
   */
  async calculateAllowances(employeeId: string, baseSalary: number): Promise<AllowanceBreakdown> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { jobRole: true, department: true },
    });

    if (!employee) {
      throw new Error(`Employee ${employeeId} not found`);
    }

    // Housing allowance: typically 10% of salary
    const housing = baseSalary * 0.1;

    // Transport allowance: typically 5-8% of salary
    const transport = baseSalary * 0.05;

    // Meal allowance: fixed amount per diem
    const meal = 5000; // ₦5,000 per day

    // Entertainment/welfare: company policy dependent
    const entertainment = baseSalary * 0.02;

    // Other allowances
    const otherAllowances = await this.getOtherAllowances(employeeId, baseSalary);

    const total = housing + transport + meal + entertainment + otherAllowances;

    return {
      housing: Math.round(housing),
      transport: Math.round(transport),
      meal: Math.round(meal),
      entertainment: Math.round(entertainment),
      otherAllowances: Math.round(otherAllowances),
      total: Math.round(total),
    };
  }

  /**
   * Get company-specific allowances
   */
  private async getOtherAllowances(
    employeeId: string,
    baseSalary: number,
  ): Promise<number> {
    // Can be extended for custom allowances
    return 0;
  }

  /**
   * Validate deductions don't exceed salary
   */
  validateDeductions(grossPay: number, deductions: number): boolean {
    // Deductions should not exceed 50% of gross pay
    const maxDeductionPercent = 0.5;
    return deductions <= grossPay * maxDeductionPercent;
  }

  /**
   * Get deduction rules for a department
   */
  async getDeductionRules(departmentId: string) {
    const department = await this.prisma.department.findUnique({
      where: { id: departmentId },
    });

    return {
      department: department?.name,
      pensionRate: 0.08,
      nhisRate: 0.05,
      maxDeductionPercent: 0.5,
      leaveDeductionApplies: true,
      taxExemptionsApply: true,
    };
  }
}
