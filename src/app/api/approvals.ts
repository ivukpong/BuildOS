import { apiFetch } from "./client";

export interface ApprovalFlowTierLevel {
    level: number;
    approver: string;
    condition: string;
}

export interface ApprovalFlow {
    workflowType: "single" | "group" | "tier";
    approvers: string[];
    tierLevels?: ApprovalFlowTierLevel[];
}

export interface ApprovalItem {
    id: string;
    module: string;
    type: string;
    title: string;
    project: string;
    requestedBy: string;
    date: string;
    amount?: number;
    status: "pending" | "approved" | "rejected";
    urgency: "normal" | "urgent";
    description: string;
    approvalFlow?: ApprovalFlow | null;
}

export function getApprovals(module?: string) {
    const query = module ? `?module=${encodeURIComponent(module)}` : "";
    return apiFetch<ApprovalItem[]>(`/admin/approvals${query}`);
}

export function approveItem(id: string, notes?: string) {
    return apiFetch<ApprovalItem>(`/admin/approvals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved', notes }),
    });
}

export function rejectItem(id: string, reason?: string) {
    return apiFetch<ApprovalItem>(`/admin/approvals/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'rejected', reason }),
    });
}
