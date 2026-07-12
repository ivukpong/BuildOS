import { apiFetch } from './client';

export const EMPLOYMENT_TYPE_TO_DISPLAY: Record<string, string> = { FullTime: 'Full-time', Contract: 'Contract' };
export const EMPLOYMENT_TYPE_TO_BACKEND: Record<string, string> = { 'Full-time': 'FullTime', Contract: 'Contract' };

function mapEmployee(e: any) {
    const statusMap: Record<string, string> = { active: 'active', inactive: 'inactive', on_leave: 'on_leave' };
    return {
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        role: e.role,
        department: e.department?.name ?? '',
        departmentId: e.departmentId ?? e.department?.id ?? '',
        status: statusMap[e.status] ?? e.status,
        email: e.email,
        phone: e.phone,
        dateHired: e.dateHired ? new Date(e.dateHired).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        dateHiredISO: e.dateHired ? new Date(e.dateHired).toISOString().slice(0, 10) : '',
        employmentType: EMPLOYMENT_TYPE_TO_DISPLAY[e.employmentType] ?? e.employmentType,
        projectCount: e.projectCount ?? 0,
        projects: e.projects ?? [],
        dateOfBirth: e.dateOfBirth ? new Date(e.dateOfBirth).toISOString().slice(0, 10) : '',
        gender: e.gender ?? '',
        address: e.address ?? '',
        city: e.city ?? '',
        state: e.state ?? '',
        zipCode: e.zipCode ?? '',
        emergencyContact: e.emergencyContact ?? '',
        emergencyPhone: e.emergencyPhone ?? '',
        gradeLevel: e.gradeLevel ?? '',
        baseSalary: e.baseSalary ?? 0,
    };
}

/**
 * Converts a profile-page edit draft (display-friendly values) back into the
 * shape the backend accepts (enum values + departmentId instead of names).
 */
export function toEmployeeUpdatePayload(draft: any) {
    const { department, dateHired, dateHiredISO, projectCount, projects, id, status, employmentType, departmentId, ...rest } = draft;
    return {
        ...rest,
        status,
        departmentId: departmentId || undefined,
        employmentType: EMPLOYMENT_TYPE_TO_BACKEND[employmentType] ?? employmentType,
        dateHired: dateHiredISO || undefined,
    };
}

export async function fetchEmployees(params?: { status?: string; departmentId?: string }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set('status', params.status);
    if (params?.departmentId) qs.set('departmentId', params.departmentId);
    const query = qs.toString() ? `?${qs}` : '';
    const data = await apiFetch<any[]>(`/employees${query}`);
    return data.map(mapEmployee);
}

export async function fetchEmployee(id: string) {
    const data = await apiFetch<any>(`/employees/${id}`);
    return mapEmployee(data);
}

export function createEmployee(data: any) {
    return apiFetch(`/employees`, { method: 'POST', body: JSON.stringify(data) });
}

export function updateEmployee(id: string, data: any) {
    return apiFetch(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}

export function deleteEmployee(id: string) {
    return apiFetch(`/employees/${id}`, { method: 'DELETE' });
}
