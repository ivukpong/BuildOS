import { apiFetch } from './client';

// App-level task shape used by the My Tasks / Tasks board (TaskContext).
export interface AppTaskApi {
    id: string;
    name: string;
    description: string;
    assignedTo: string;
    assignedBy: string;
    dueDate: string;
    priority: string;
    category: string;
    status: string;
    app: string;
    projectId?: string;
    projectName?: string;
    createdAt: string;
    startedAt?: string;
    submittedAt?: string;
    resolvedAt?: string;
    declineReason?: string;
}

type TaskEnvelope = { success: boolean; data: any[]; total?: number };

function toDateString(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') {
        // Already a plain date string (YYYY-MM-DD) — keep as-is.
        return value.length === 10 ? value : value.slice(0, 10);
    }
    return new Date(value).toISOString().slice(0, 10);
}

function mapTask(t: any): AppTaskApi {
    return {
        id: t.id,
        name: t.title ?? '',
        description: t.description ?? '',
        assignedTo: t.assignedTo ?? '',
        assignedBy: t.assignedBy ?? '',
        dueDate: toDateString(t.dueDate),
        priority: t.priority ?? 'Medium',
        category: t.category ?? 'general',
        status: t.status ?? 'To Do',
        app: t.app ?? 'projects',
        projectId: t.projectId ?? undefined,
        projectName: t.projectName ?? undefined,
        createdAt: toDateString(t.createdAt),
        startedAt: t.startedAt ?? undefined,
        submittedAt: t.submittedAt ?? undefined,
        resolvedAt: t.resolvedAt ?? undefined,
        declineReason: t.declineReason ?? undefined,
    };
}

// Map the frontend AppTask fields onto the backend Task model (title <- name).
function toBackend(data: Record<string, any>): Record<string, any> {
    const out: Record<string, any> = { ...data };
    if ('name' in out) {
        out.title = out.name;
        delete out.name;
    }
    return out;
}

export type BoardStatus =
    | 'To Do'
    | 'In Progress'
    | 'Awaiting Approval'
    | 'Approved'
    | 'Declined';

/**
 * Normalises any stored task status onto the My Tasks board columns so tasks
 * never disappear from the board (statuses are written by several pages using
 * different vocabularies: "Pending"/"Completed", "todo"/"done", board labels).
 */
export function toBoardStatus(status: string | undefined): BoardStatus {
    const s = (status ?? '').toLowerCase().replace(/[^a-z]/g, '');
    switch (s) {
        case 'inprogress':
            return 'In Progress';
        case 'awaitingapproval':
        case 'submitted':
            return 'Awaiting Approval';
        case 'approved':
        case 'completed':
        case 'done':
            return 'Approved';
        case 'declined':
        case 'rejected':
        case 'blocked':
        case 'cancelled':
            return 'Declined';
        default:
            return 'To Do';
    }
}

export async function listAppTasks(): Promise<AppTaskApi[]> {
    const res = await apiFetch<TaskEnvelope>('/tasks?limit=500');
    const rows = Array.isArray(res) ? res : res?.data ?? [];
    return rows.map(mapTask);
}

export async function createAppTask(data: Record<string, any>): Promise<AppTaskApi> {
    const res = await apiFetch<{ success: boolean; data: any }>('/tasks', {
        method: 'POST',
        body: JSON.stringify(toBackend(data)),
    });
    return mapTask((res as any)?.data ?? res);
}

export async function updateAppTask(id: string, data: Record<string, any>): Promise<AppTaskApi> {
    const res = await apiFetch<{ success: boolean; data: any }>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(toBackend(data)),
    });
    return mapTask((res as any)?.data ?? res);
}

export async function deleteAppTask(id: string): Promise<void> {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
}
