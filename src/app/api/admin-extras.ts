import { apiFetch } from './client';

export interface AppUser {
    id: string; name: string; email: string; role: string;
    department?: string; position?: string; status: string;
    assignedApps?: string[];
    lastLogin?: string; createdAt: string;
}
export interface AppRole {
    id: string; name: string; description?: string;
    permissions: string[] | Record<string, unknown>;
    isSystem?: boolean;
    isSuper?: boolean;
    createdAt: string;
}
export interface AdminSystemSummary {
    users: number;
    roles: number;
    activeSessions: number;
    pendingApprovals: number;
    openTickets?: number;
    usersThisMonth: number;
    pendingInvites: number;
    healthPercent: number;
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

export interface IssueTypeConfig {
    id: string;
    name: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    color: string;
    slaHours: number;
    active: boolean;
}

export interface ChangeCategoryConfig {
    id: string;
    name: string;
    description: string;
}

export interface UnitOfMeasurement {
    id: string;
    name: string;
    abbreviation: string;
    category: string;
    baseUnit: string;
    conversionFactor: number;
}

export interface EmailTemplateConfig {
    id: string;
    name: string;
    subject: string;
    trigger: string;
}

export interface NotificationRuleConfig {
    id: string;
    name: string;
    event: string;
    recipients: string;
    channels: string[];
    enabled: boolean;
}

export interface ProcessCatalogItem {
    id: string;
    label: string;
    app: string;
    description: string;
    requiresApproval: boolean;
}

export type ApprovalType = 'single' | 'group' | 'tier';

export interface ProcessWorkflowTierLevel {
    level: number;
    approver: string;
    condition: string;
}

export interface ProcessWorkflow {
    id: string;
    processId: string;
    process: string;
    app: string;
    workflowType: ApprovalType;
    approver?: string;
    groupApprovers?: string[];
    tierLevels?: ProcessWorkflowTierLevel[];
}

export const getAdminSystemSummary = () =>
    apiFetch<AdminSystemSummary>('/admin/system-summary');
export const getAdminActivityLog = () =>
    apiFetch<AdminActivity[]>('/admin/activity-log');
export const getAuditLogs = (params?: { limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.limit) qs.set('limit', params.limit.toString());
    if (params?.offset) qs.set('offset', params.offset.toString());
    const query = qs.toString() ? `?${qs}` : '';
    return apiFetch<any[]>(`/audit-logs${query}`);
};
export const inviteUser = (data: { email: string; name: string; role: string; assignedApps?: string[]; department?: string }) =>
    apiFetch<{
        id: string;
        email: string;
        status: string;
        assignedApps: string[];
        inviteToken: string;
        activationLink: string;
        inviteEmailSent: boolean;
    }>(
        '/admin/users/invite', { method: 'POST', body: JSON.stringify(data) }
    );
export const resendInvite = (id: string) =>
    apiFetch<{
        id: string;
        email: string;
        status: string;
        activationLink: string;
        inviteEmailSent: boolean;
    }>(`/admin/users/${id}/resend-invite`, { method: 'POST' });

// Users
export const getUsers = (search?: string) =>
    apiFetch<AppUser[]>(search ? `/admin/users?search=${encodeURIComponent(search)}` : '/admin/users');
export const getUser = (id: string) => apiFetch<AppUser>(`/admin/users/${id}`);
export const createUser = (data: Partial<AppUser> & { password?: string }) =>
    apiFetch<AppUser>('/admin/users', { method: 'POST', body: JSON.stringify(data) });
export const updateUser = (id: string, data: Partial<AppUser> & { password?: string }) =>
    apiFetch<AppUser>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteUser = (id: string) =>
    apiFetch<void>(`/admin/users/${id}`, { method: 'DELETE' });

// App Roles
export const getAppRoles = () => apiFetch<AppRole[]>('/admin/roles');
export const getAppRole = (id: string) => apiFetch<AppRole>(`/admin/roles/${id}`);
export const createAppRole = (data: Partial<AppRole>) =>
    apiFetch<AppRole>('/admin/roles', { method: 'POST', body: JSON.stringify(data) });
export const updateAppRole = (id: string, data: Partial<AppRole>) =>
    apiFetch<AppRole>(`/admin/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteAppRole = (id: string) =>
    apiFetch<void>(`/admin/roles/${id}`, { method: 'DELETE' });

// Issue Types
export const getIssueTypes = () => apiFetch<IssueTypeConfig[]>('/admin/issue-types');
export const createIssueType = (data: Omit<IssueTypeConfig, 'id'>) =>
    apiFetch<IssueTypeConfig>('/admin/issue-types', { method: 'POST', body: JSON.stringify(data) });
export const updateIssueType = (id: string, data: Partial<Omit<IssueTypeConfig, 'id'>>) =>
    apiFetch<IssueTypeConfig>(`/admin/issue-types/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteIssueType = (id: string) =>
    apiFetch<{ ok: boolean }>(`/admin/issue-types/${id}`, { method: 'DELETE' });

// Change Categories
export const getChangeCategories = () => apiFetch<ChangeCategoryConfig[]>('/admin/change-categories');
export const createChangeCategory = (data: Omit<ChangeCategoryConfig, 'id'>) =>
    apiFetch<ChangeCategoryConfig>('/admin/change-categories', { method: 'POST', body: JSON.stringify(data) });
export const updateChangeCategory = (id: string, data: Partial<Omit<ChangeCategoryConfig, 'id'>>) =>
    apiFetch<ChangeCategoryConfig>(`/admin/change-categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteChangeCategory = (id: string) =>
    apiFetch<{ ok: boolean }>(`/admin/change-categories/${id}`, { method: 'DELETE' });

// Process Catalog
export const getProcessCatalog = () =>
    apiFetch<ProcessCatalogItem[]>('/admin/process-catalog');
export const createProcessCatalogItem = (data: Omit<ProcessCatalogItem, 'id'> & { id?: string }) =>
    apiFetch<ProcessCatalogItem>('/admin/process-catalog', { method: 'POST', body: JSON.stringify(data) });
export const updateProcessCatalogItem = (id: string, data: Partial<Omit<ProcessCatalogItem, 'id'>>) =>
    apiFetch<ProcessCatalogItem>(`/admin/process-catalog/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteProcessCatalogItem = (id: string) =>
    apiFetch<{ ok: boolean }>(`/admin/process-catalog/${id}`, { method: 'DELETE' });

// Process Workflows
export const getProcessWorkflows = () =>
    apiFetch<ProcessWorkflow[]>('/admin/process-workflows');
export const createProcessWorkflow = (data: Omit<ProcessWorkflow, 'id'> & { id?: string }) =>
    apiFetch<ProcessWorkflow>('/admin/process-workflows', { method: 'POST', body: JSON.stringify(data) });
export const updateProcessWorkflow = (id: string, data: Partial<Omit<ProcessWorkflow, 'id'>>) =>
    apiFetch<ProcessWorkflow>(`/admin/process-workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteProcessWorkflow = (id: string) =>
    apiFetch<{ ok: boolean }>(`/admin/process-workflows/${id}`, { method: 'DELETE' });

// Units of Measurement
export const getUnits = () => apiFetch<UnitOfMeasurement[]>('/admin/units');
export const createUnit = (data: Omit<UnitOfMeasurement, 'id'>) =>
    apiFetch<UnitOfMeasurement>('/admin/units', { method: 'POST', body: JSON.stringify(data) });
export const updateUnit = (id: string, data: Partial<Omit<UnitOfMeasurement, 'id'>>) =>
    apiFetch<UnitOfMeasurement>(`/admin/units/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
export const deleteUnit = (id: string) =>
    apiFetch<{ ok: boolean }>(`/admin/units/${id}`, { method: 'DELETE' });

// Notifications & Templates
export const getEmailTemplates = () =>
    apiFetch<EmailTemplateConfig[]>('/admin/email-templates');
export const getNotificationRules = () =>
    apiFetch<NotificationRuleConfig[]>('/admin/notification-rules');

// Company Profile
export interface CompanyProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    logoUrl?: string | null;
    updatedAt?: string;
}
export const getCompanyProfile = () => apiFetch<CompanyProfile>('/company-profile');
export const updateCompanyProfile = (data: Partial<CompanyProfile>) =>
    apiFetch<CompanyProfile>('/company-profile', { method: 'PUT', body: JSON.stringify(data) });

// Directors
export interface Director {
    id: string;
    firstName: string;
    middleName: string;
    lastName: string;
    designation: string;
    sequence: number;
    createdAt?: string;
    updatedAt?: string;
}
export const getDirectors = () => apiFetch<Director[]>('/admin/directors');
export const createDirector = (data: Omit<Director, 'id' | 'createdAt' | 'updatedAt'>) =>
    apiFetch<Director>('/admin/directors', { method: 'POST', body: JSON.stringify(data) });
export const updateDirector = (id: string, data: Partial<Director>) =>
    apiFetch<Director>(`/admin/directors/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const reorderDirectors = (items: Array<{ id: string; sequence: number }>) =>
    apiFetch<Director[]>('/admin/directors/reorder', { method: 'PATCH', body: JSON.stringify({ items }) });
export const deleteDirector = (id: string) =>
    apiFetch<void>(`/admin/directors/${id}`, { method: 'DELETE' });