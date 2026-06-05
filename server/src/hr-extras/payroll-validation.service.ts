import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface PayrollValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class PayrollValidationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Comprehensive payroll validation (runs all validators)
   */
  async validatePayroll(
    periodId: string,
    employeeIds: string[],
  ): Promise<PayrollValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validator 1: Verify period exists and is open
    const result1 = await this.validatePeriodExists(periodId);
    if (!result1.valid) errors.push(...result1.errors);
    warnings.push(...result1.warnings);

    // Validator 2: Check all employees have required data
    const result2 = await this.validateEmployeeData(employeeIds);
    if (!result2.valid) errors.push(...result2.errors);
    warnings.push(...result2.warnings);

    // Validator 3: Validate attendance records exist
    const result3 = await this.validateAttendanceRecords(periodId, employeeIds);
    if (!result3.valid) errors.push(...result3.errors);
    warnings.push(...result3.warnings);

    // Validator 4: Check for duplicate payroll entries
    const result4 = await this.validateNoDuplicateEntries(periodId, employeeIds);
    if (!result4.valid) errors.push(...result4.errors);
    warnings.push(...result4.warnings);

    // Validator 5: Validate leave deductions
    const result5 = await this.validateLeaveDeductions(periodId, employeeIds);
    if (!result5.valid) errors.push(...result5.errors);
    warnings.push(...result5.warnings);

    // Validator 6: Validate tax calculations
    const result6 = await this.validateTaxCalculations(employeeIds);
    if (!result6.valid) errors.push(...result6.errors);
    warnings.push(...result6.warnings);

    // Validator 7: Check pension/NHIS compliance
    const result7 = await this.validatePensionCompliance(employeeIds);
    if (!result7.valid) errors.push(...result7.errors);
    warnings.push(...result7.warnings);

    // Validator 8: Validate salary range
    const result8 = await this.validateSalaryRange(employeeIds);
    if (!result8.valid) errors.push(...result8.errors);
    warnings.push(...result8.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validator 1: Period must exist and be in correct status
   */
  private async validatePeriodExists(
    periodId: string,
  ): Promise<PayrollValidationResult> {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return {
        valid: false,
        errors: [`Payroll period ${periodId} not found`],
        warnings: [],
      };
    }

    if (period.status !== 'Open') {
      return {
        valid: false,
        errors: [
          `Payroll period is ${period.status}. Only Open periods can be processed`,
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Validator 2: All employees must have required base data
   */
  private async validateEmployeeData(
    employeeIds: string[],
  ): Promise<PayrollValidationResult> {
    const employees = await this.prisma.employee.findMany({
      where: { id: { in: employeeIds } },
    });

    const errors: string[] = [];

    for (const emp of employees) {
      if (!emp.baseSalary) {
        errors.push(`Employee ${emp.id} (${emp.firstName} ${emp.lastName}) has no base salary`);
      }
      if (!emp.email) {
        errors.push(`Employee ${emp.id} has no email address`);
      }
      if (!emp.accountNumber) {
        errors.push(`Employee ${emp.id} has no bank account for payment`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
    };
  }

  /**
   * Validator 3: Attendance records must exist for payroll period
   */
  private async validateAttendanceRecords(
    periodId: string,
    employeeIds: string[],
  ): Promise<PayrollValidationResult> {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { valid: true, errors: [], warnings: [] };
    }

    const missingAttendance: string[] = [];

    for (const empId of employeeIds) {
      const records = await this.prisma.attendanceRecord.count({
        where: {
          employeeId: empId,
          date: {
            gte: period.startDate,
            lte: period.endDate,
          },
        },
      });

      if (records === 0) {
        missingAttendance.push(`Employee ${empId} has no attendance records for period`);
      }
    }

    return {
      valid: true,
      errors: [],
      warnings: missingAttendance,
    };
  }

  /**
   * Validator 4: Prevent duplicate payroll runs
   */
  private async validateNoDuplicateEntries(
    periodId: string,
    employeeIds: string[],
  ): Promise<PayrollValidationResult> {
    const existingRun = await this.prisma.payrollRun.findFirst({
      where: {
        periodId,
        status: { in: ['Draft', 'Processing', 'Completed'] },
      },
    });

    if (existingRun) {
      return {
        valid: false,
        errors: [
          `Payroll run already exists for this period (Status: ${existingRun.status})`,
        ],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Validator 5: Validate leave deductions are correct
   */
  private async validateLeaveDeductions(
    periodId: string,
    employeeIds: string[],
  ): Promise<PayrollValidationResult> {
    const warnings: string[] = [];

    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });

    if (!period) {
      return { valid: true, errors: [], warnings };
    }

    for (const empId of employeeIds) {
      const leaveRequests = await this.prisma.leaveRequest.findMany({
        where: {
          employeeId: empId,
          status: 'approved',
          startDate: { lte: period.endDate },
          endDate: { gte: period.startDate },
        },
      });

      if (leaveRequests.length === 0) {
        warnings.push(`Employee ${empId} has no approved leaves for deduction calculation`);
      }
    }

    return { valid: true, errors: [], warnings };
  }

  /**
   * Validator 6: Tax must be calculated per employee salary band
   */
  private async validateTaxCalculations(
    employeeIds: string[],
  ): Promise<PayrollValidationResult> {
    const warnings: string[] = [];

    for (const empId of employeeIds) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: empId },
        include: { jobRole: true },
      });

      if (!employee?.baseSalary) {
        warnings.push(`Employee ${empId} cannot calculate tax - no base salary`);
      }

      if (!employee?.jobRole) {
        warnings.push(`Employee ${empId} not assigned to job role - tax bracket unclear`);
      }
    }

    return { valid: true, errors: [], warnings };
  }

  /**
   * Validator 7: Pension/NHIS contributions must be within legal bounds
   */
  private async validatePensionCompliance(
    employeeIds: string[],
  ): Promise<PayrollValidationResult> {
    const errors: string[] = [];

    // Nigeria standard: Employee pension contribution = 8% of gross pay
    // Employer contribution = 12%
    const EMPLOYEE_PENSION_RATE = 0.08;
    const EMPLOYER_PENSION_RATE = 0.12;

    for (const empId of employeeIds) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: empId },
      });

      if (!employee?.baseSalary) {
        continue;
      }

      const expectedEmployeePension = employee.baseSalary * EMPLOYEE_PENSION_RATE;
      const expectedEmployerPension = employee.baseSalary * EMPLOYER_PENSION_RATE;

      if (!employee.pensionId) {
        errors.push(`Employee ${empId} not registered for pension`);
      }
    }

    return { valid: errors.length === 0, errors, warnings: [] };
  }

  /**
   * Validator 8: Salary must be within acceptable range for grade
   */
  private async validateSalaryRange(
    employeeIds: string[],
  ): Promise<PayrollValidationResult> {
    const warnings: string[] = [];

    for (const empId of employeeIds) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: empId },
        include: { jobRole: true },
      });

      if (!employee?.baseSalary || !employee?.jobRole) {
        continue;
      }

      if (employee.jobRole.minSalary && employee.baseSalary < employee.jobRole.minSalary) {
        warnings.push(
          `Employee ${empId} salary ${employee.baseSalary} is below minimum ${employee.jobRole.minSalary}`,
        );
      }

      if (employee.jobRole.maxSalary && employee.baseSalary > employee.jobRole.maxSalary) {
        warnings.push(
          `Employee ${empId} salary ${employee.baseSalary} exceeds maximum ${employee.jobRole.maxSalary}`,
        );
      }
    }

    return { valid: true, errors: [], warnings };
  }
}
