import { apiFetch } from './client';

function mapEmployee(e: any) {
    const employmentTypeMap: Record<string, string> = { FullTime: 'Full-time', Contract: 'Contract' };
    const statusMap: Record<string, string> = { active: 'active', inactive: 'inactive', on_leave: 'on_leave' };
    return {
        id: e.id,
        firstName: e.firstName,
        lastName: e.lastName,
        role: e.role,
        department: e.department?.name ?? '',
        status: statusMap[e.status] ?? e.status,
        email: e.email,
        phone: e.phone,
        dateHired: e.dateHired ? new Date(e.dateHired).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        employmentType: employmentTypeMap[e.employmentType] ?? e.employmentType,
        projectCount: e.projectCount ?? 0,
        projects: e.projects ?? [],
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
