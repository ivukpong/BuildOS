import { apiFetch } from './client';

const statusMap: Record<string, string> = {
    OnTrack: 'On Track', AtRisk: 'At Risk', OverBudget: 'Over Budget',
};

function mapBudget(b: any) {
    return {
        id: b.id,
        name: b.name ?? '',
        scope: b.scope,
        totalBudget: b.totalBudget ?? 0,
        spent: b.spent ?? 0,
        committed: b.committed ?? 0,
        period: b.period ?? '',
        status: statusMap[b.status] ?? b.status,
    };
}

export async function fetchBudgets(params?: { status?: string; scope?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.scope) qs.set('scope', params.scope);
    const query = qs.toString() ? `?${qs}` : '';
    const data = await apiFetch<any[]>(`/budgets${query}`);
    return data.map(mapBudget);
}

export interface BudgetBreakdown {
    category: string;
    budgeted: number;
    actual: number;
}

export async function fetchBudgetBreakdown(projectId?: string) {
    const query = projectId ? `?projectId=${encodeURIComponent(projectId)}` : '';
    return apiFetch<BudgetBreakdown[]>(`/budgets/breakdown${query}`);
}
