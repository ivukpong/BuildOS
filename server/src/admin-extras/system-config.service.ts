import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface EmailConfig {
  id: string;
  name: string;
  smtpServer: string;
  smtpPort: number;
  email: string;
  password: string;
  sslEnabled: boolean;
  retryAttempts: number;
  isActive: boolean;
}

@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get company profile
   */
  async getCompanyProfile() {
    let profile = await this.prisma.companyProfile.findUnique({
      where: { id: 'singleton' },
    });

    if (!profile) {
      profile = await this.prisma.companyProfile.create({
        data: { id: 'singleton' },
      });
    }

    return profile;
  }

  /**
   * Update company profile
   */
  async updateCompanyProfile(data: any) {
    return this.prisma.companyProfile.update({
      where: { id: 'singleton' },
      data,
    });
  }

  /**
   * Get all tax configurations
   */
  async getTaxConfigs() {
    return this.prisma.taxConfig.findMany();
  }

  /**
   * Create/Update tax configuration
   */
  async saveTaxConfig(data: any) {
    if (data.id) {
      return this.prisma.taxConfig.update({
        where: { id: data.id },
        data,
      });
    }

    return this.prisma.taxConfig.create({ data });
  }

  /**
   * Delete tax configuration
   */
  async deleteTaxConfig(id: string) {
    return this.prisma.taxConfig.delete({ where: { id } });
  }

  /**
   * Get approval workflows
   */
  async getApprovalWorkflows() {
    const workflows = await this.prisma.approvalWorkflow.findMany({
      include: { nodes: true, rules: true },
    });
    return workflows;
  }

  /**
   * Create approval workflow
   */
  async createApprovalWorkflow(data: any) {
    const workflow = await this.prisma.approvalWorkflow.create({
      data: {
        name: data.name,
        description: data.description,
        processType: data.processType,
        isActive: data.isActive ?? true,
      },
    });

    // Create nodes if provided
    if (data.nodes && Array.isArray(data.nodes)) {
      for (const node of data.nodes) {
        await this.prisma.approvalNode.create({
          data: {
            workflowId: workflow.id,
            sequence: node.sequence,
            name: node.name,
            approverRole: node.approverRole,
            approverEmail: node.approverEmail,
            canDelegate: node.canDelegate ?? false,
            escalateAfter: node.escalateAfter,
          },
        });
      }
    }

    return workflow;
  }

  /**
   * Update approval workflow
   */
  async updateApprovalWorkflow(id: string, data: any) {
    return this.prisma.approvalWorkflow.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete approval workflow
   */
  async deleteApprovalWorkflow(id: string) {
    // Delete related nodes and rules
    await this.prisma.approvalNode.deleteMany({ where: { workflowId: id } });
    await this.prisma.approvalRule.deleteMany({ where: { workflowId: id } });

    return this.prisma.approvalWorkflow.delete({ where: { id } });
  }

  /**
   * Get holidays
   */
  async getHolidays(year?: number) {
    const where: any = {};
    if (year) {
      where.date = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    return this.prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Create holiday
   */
  async createHoliday(data: any) {
    return this.prisma.holiday.create({
      data,
    });
  }

  /**
   * Delete holiday
   */
  async deleteHoliday(id: string) {
    return this.prisma.holiday.delete({ where: { id } });
  }

  /**
   * Get salary bands
   */
  async getSalaryBands() {
    return this.prisma.salaryBand.findMany({
      orderBy: { minSalary: 'asc' },
    });
  }

  /**
   * Create salary band
   */
  async createSalaryBand(data: any) {
    if (data.minSalary >= data.maxSalary) {
      throw new BadRequestException('Min salary must be less than max salary');
    }

    return this.prisma.salaryBand.create({
      data,
    });
  }

  /**
   * Update salary band
   */
  async updateSalaryBand(id: string, data: any) {
    return this.prisma.salaryBand.update({
      where: { id },
      data,
    });
  }

  /**
   * Get document upload settings
   */
  async getDocumentSettings() {
    return {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword'],
      allowedDocumentTypes: ['contract', 'invoice', 'photo', 'report', 'specification'],
    };
  }

  /**
   * Get compliance settings
   */
  async getComplianceSettings() {
    const documentTypes = await this.prisma.complianceDocumentType.findMany();
    return {
      documentTypes,
      auditLogRetentionDays: 365,
      mandatoryDocumentTypes: documentTypes.filter((d) => d.level === 'Mandatory'),
    };
  }

  /**
   * Get application settings
   */
  async getApplicationSettings() {
    return {
      company: await this.getCompanyProfile(),
      tax: await this.getTaxConfigs(),
      salaryBands: await this.getSalaryBands(),
      documentSettings: await this.getDocumentSettings(),
      complianceSettings: await this.getComplianceSettings(),
    };
  }
}
