import { apiFetch } from "./client";

export interface ReferenceData {
    projects: { id: string; name: string; status: string; type: string }[];
    suppliers: { id: string; name: string; categories: string[] }[];
    materials: { id: string; name: string; category: string; unit: string }[];
    stores: { id: string; name: string; type: string; projectName?: string }[];
    departments: { id: string; name: string }[];
    claimTypes: { id: string; name: string }[];
    leaveTypes: { id: string; name: string }[];
    chartAccounts: { id: string; code: string; name: string; type: string }[];
}

export function getReferenceData() {
    return apiFetch<ReferenceData>("/reference-data");
}
