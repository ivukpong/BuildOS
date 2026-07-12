import { apiFetch } from './client';

export interface JobRole {
    id: string;
    title: string;
    department: string;
    gradeLevel?: string;
    minSalary?: string;
    maxSalary?: string;
    headcount: number;
    responsibilities: string[];
    skills: string[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateJobRoleDto {
    title: string;
    department: string;
    gradeLevel?: string;
    minSalary?: string;
    maxSalary?: string;
    headcount?: number;
    responsibilities?: string[];
    skills?: string[];
}

export function getJobRoles(department?: string): Promise<JobRole[]> {
    const qs = department ? `?department=${encodeURIComponent(department)}` : '';
    return apiFetch<JobRole[]>(`/job-roles${qs}`);
}

export function getJobRole(id: string): Promise<JobRole> {
    return apiFetch<JobRole>(`/job-roles/${id}`);
}

export function createJobRole(dto: CreateJobRoleDto): Promise<JobRole> {
    return apiFetch<JobRole>('/job-roles', { method: 'POST', body: JSON.stringify(dto) });
}

export function deleteJobRole(id: string): Promise<void> {
    return apiFetch<void>(`/job-roles/${id}`, { method: 'DELETE' });
}

export function updateJobRole(id: string, dto: Partial<CreateJobRoleDto>): Promise<JobRole> {
    return apiFetch<JobRole>(`/job-roles/${id}`, { method: 'PUT', body: JSON.stringify(dto) });
}

export function deleteJobRole(id: string): Promise<JobRole> {
    return apiFetch<JobRole>(`/job-roles/${id}`, { method: 'DELETE' });
}
