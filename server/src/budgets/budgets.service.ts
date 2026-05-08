import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetsService {
    constructor(private prisma: PrismaService) { }

    findAll(status?: string, scope?: string) {
        return this.prisma.budget.findMany({
            where: {
                ...(status ? { status: status as any } : {}),
                ...(scope ? { scope: scope as any } : {}),
            },
            include: { project: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    findOne(id: string) {
        return this.prisma.budget.findUniqueOrThrow({
            where: { id },
            include: { project: true },
        });
    }

    async breakdown(projectId?: string) {
        const [expenses, budgets] = await Promise.all([
            this.prisma.expense.groupBy({
                by: ['category'],
                where: projectId ? { projectId } : {},
                _sum: { amount: true },
            }),
            this.prisma.budget.findMany({
                where: projectId ? { projectId } : {},
            }),
        ]);
        const totalBudgeted = budgets.reduce((sum, b) => sum + b.totalBudget, 0);
        const totalActual = expenses.reduce((sum, e) => sum + (e._sum.amount ?? 0), 0);

        if (expenses.length === 0) {
            return budgets.map((b) => ({
                category: b.name,
                budgeted: b.totalBudget,
                actual: b.spent,
            }));
        }

        return expenses.map((e) => {
            const actual = e._sum.amount ?? 0;
            return {
                category: e.category,
                budgeted: totalActual > 0 ? (actual / totalActual) * totalBudgeted : 0,
                actual,
            };
        });
    }

    create(data: any) {
        return this.prisma.budget.create({ data, include: { project: true } });
    }

    update(id: string, data: any) {
        return this.prisma.budget.update({ where: { id }, data, include: { project: true } });
    }

    remove(id: string) {
        return this.prisma.budget.delete({ where: { id } });
    }
}
