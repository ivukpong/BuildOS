import { apiFetch, toApiArray, unwrapApiResult } from './client';

export interface Task {
    id: string;
    title: string;
    description?: string;
    status: string;
    priority: string;
    assignedTo?: string;
    projectId?: string;
    projectName?: string;
    dueDate?: string;
    tags: string[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTaskDto {
    title: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedTo?: string;
    projectId?: string;
    projectName?: string;
    dueDate?: string;
    tags?: string[];
    createdBy?: string;
}

export async function getTasks(status?: string, projectId?: string, assignedTo?: string): Promise<Task[]> {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (projectId) params.set('projectId', projectId);
    if (assignedTo) params.set('assignedTo', assignedTo);
    params.set('limit', '500');
    return toApiArray<Task>(await apiFetch(`/tasks?${params}`));
}

export async function getTask(id: string): Promise<Task> {
    return unwrapApiResult<Task>(await apiFetch(`/tasks/${id}`));
}

export async function createTask(dto: CreateTaskDto): Promise<Task> {
    return unwrapApiResult<Task>(
        await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(dto) }),
    );
}

export async function updateTask(id: string, dto: Partial<CreateTaskDto>): Promise<Task> {
    return unwrapApiResult<Task>(
        await apiFetch(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(dto) }),
    );
}

export async function deleteTask(id: string): Promise<Task> {
    return unwrapApiResult<Task>(await apiFetch(`/tasks/${id}`, { method: 'DELETE' }));
}
