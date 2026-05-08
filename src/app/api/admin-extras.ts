import { apiFetch } from './client';

export interface AppUser {
    id: string; name: string; email: string; role: string;
    department?: string; position?: string; isActive: boolean;
    lastLogin?: string; createdAt: string;
}
export interface AppRole {
    id: string; name: string; description?: string;
    permissions: string[]; isSystem: boolean; createdAt: string;
}
export interface AdminSystemSummary {
    users: number;
    roles: number;
    activeSessions: number;
    pendingApprovals: number;
    health: { status: string; uptimeSeconds: number; checkedAt: string };
}
export interface AdminActivity {
    id: string;
    actor: string;
    action: string;
    subject: string;
    status: string;
    date: string;
}

export const getAdminSystemSummary = () =>
    apiFetch<AdminSystemSummary>('/admin/system-summary');
export const getAdminActivityLog = () =>
    apiFetch<AdminActivity[]>('/admin/activity-log');

// Users
export const getUsers = (search?: string) =>
    apiFetch<AppUser[]>(search ? `/users?search=${encodeURIComponent(search)}` : '/users');
export const getUser = (id: string) => apiFetch<AppUser>(`/users/${id}`);
export const createUser = (data: Partial<AppUser> & { password?: string }) =>
    apiFetch<AppUser>('/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: Partial<AppUser> & { password?: string }) =>
    apiFetch<AppUser>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUser = (id: string) =>
    apiFetch<void>(`/users/${id}`, { method: 'DELETE' });

// App Roles
export const getAppRoles = () => apiFetch<AppRole[]>('/app-roles');
export const getAppRole = (id: string) => apiFetch<AppRole>(`/app-roles/${id}`);
export const createAppRole = (data: Partial<AppRole>) =>
    apiFetch<AppRole>('/app-roles', { method: 'POST', body: JSON.stringify(data) });
export const updateAppRole = (id: string, data: Partial<AppRole>) =>
    apiFetch<AppRole>(`/app-roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAppRole = (id: string) =>
    apiFetch<void>(`/app-roles/${id}`, { method: 'DELETE' });
