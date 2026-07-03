import { apiFetch, toApiArray, unwrapApiResult } from './client';

export interface ProjectDocument {
    id: string; name: string; type: string; size?: number; url: string;
    uploadedBy?: string; folderName?: string; projectId?: string;
    tags?: string[]; createdAt: string;
}
export interface ConstructionApproval {
    id: string; type: string; reference: string; description?: string;
    projectId?: string; projectName?: string; status: string;
    requestedBy?: string; requestDate: string; reviewedBy?: string;
    reviewedAt?: string; notes?: string; createdAt: string;
}
export interface Timeline {
    id: string; name: string; projectId: string; projectName?: string;
    status: string; startDate: string; endDate: string; phases?: any[];
    createdAt: string;
}

// Project Documents
export const getProjectDocuments = (projectId?: string) =>
    apiFetch<ProjectDocument[]>(projectId ? `/project-documents?projectId=${projectId}` : '/project-documents');
export const getProjectDocument = (id: string) => apiFetch<ProjectDocument>(`/project-documents/${id}`);
export const createProjectDocument = (data: Partial<ProjectDocument>) =>
    apiFetch<ProjectDocument>('/project-documents', { method: 'POST', body: JSON.stringify(data) });
export const updateProjectDocument = (id: string, data: Partial<ProjectDocument>) =>
    apiFetch<ProjectDocument>(`/project-documents/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteProjectDocument = (id: string) =>
    apiFetch<void>(`/project-documents/${id}`, { method: 'DELETE' });

// Construction Approvals
export const getConstructionApprovals = (status?: string, projectId?: string) => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (projectId) params.set('projectId', projectId);
    const qs = params.toString();
    return apiFetch<ConstructionApproval[]>(qs ? `/construction-approvals?${qs}` : '/construction-approvals');
};
export const getConstructionApproval = (id: string) => apiFetch<ConstructionApproval>(`/construction-approvals/${id}`);
export const createConstructionApproval = (data: Partial<ConstructionApproval>) =>
    apiFetch<ConstructionApproval>('/construction-approvals', { method: 'POST', body: JSON.stringify(data) });
export const updateConstructionApproval = (id: string, data: Partial<ConstructionApproval>) =>
    apiFetch<ConstructionApproval>(`/construction-approvals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteConstructionApproval = (id: string) =>
    apiFetch<void>(`/construction-approvals/${id}`, { method: 'DELETE' });

// Timelines (backend wraps these responses in a `{ success, data }` envelope)
export const getTimelines = async (projectId?: string) =>
    toApiArray<Timeline>(
        await apiFetch(projectId ? `/timelines?projectId=${projectId}` : '/timelines'),
    );
export const getTimeline = async (id: string) =>
    unwrapApiResult<Timeline>(await apiFetch(`/timelines/${id}`));
export const createTimeline = async (data: Partial<Timeline>) =>
    unwrapApiResult<Timeline>(
        await apiFetch('/timelines', { method: 'POST', body: JSON.stringify(data) }),
    );
export const updateTimeline = async (id: string, data: Partial<Timeline>) =>
    unwrapApiResult<Timeline>(
        await apiFetch(`/timelines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    );
export const deleteTimeline = (id: string) =>
    apiFetch<void>(`/timelines/${id}`, { method: 'DELETE' });
