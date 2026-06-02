import { useState, useEffect } from "react";
import {
  getAppRoles,
  createAppRole,
  updateAppRole,
  deleteAppRole,
} from "../../api/admin-extras";
import {
  Shield,
  Plus,
  Edit,
  Copy,
  Trash2,
  X,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { Fragment } from "react";

// ── Types ─────────────────────────────────────────────────────────────────────
type AppKey =
  | "construction"
  | "finance"
  | "hr"
  | "procurement"
  | "admin"
  | "ess";

interface ProcessDef {
  id: string;
  label: string;
  app: AppKey;
}

interface ProcessPerm {
  view: boolean;
  create: boolean;
  edit: boolean;
  approve: boolean;
  delete: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  users: number;
  isSuper?: boolean;
  permissions: Record<string, ProcessPerm>; // Layer 3 — process permissions
  appAccess: Record<AppKey, boolean>; // Layer 1 — application access
  navAccess: Record<string, boolean>; // Layer 2 — navigation item access
}

// ── App config ────────────────────────────────────────────────────────────────
const APP_COLORS: Record<AppKey, string> = {
  construction: "bg-orange-100 text-orange-700",
  finance: "bg-emerald-100 text-emerald-700",
  hr: "bg-purple-100 text-purple-700",
  procurement: "bg-blue-100 text-blue-700",
  admin: "bg-indigo-100 text-indigo-700",
  ess: "bg-teal-100 text-teal-700",
};
const APP_LABELS: Record<AppKey, string> = {
  construction: "Projects",
  finance: "Finance",
  hr: "HR",
  procurement: "Procurement",
  admin: "Admin",
  ess: "ESS",
};

// ── Navigation items per app (Layer 2 catalog) ────────────────────────────────
const NAV_ITEMS: Record<AppKey, { id: string; label: string }[]> = {
  construction: [
    { id: "cs_dashboard", label: "Dashboard" },
    { id: "cs_projects", label: "Projects List" },
    { id: "cs_approvals", label: "Approvals" },
    { id: "cs_tasks", label: "Tasks" },
    { id: "cs_resources", label: "Resource Planning" },
    { id: "cs_timeline", label: "Timeline Planning" },
    { id: "cs_documents", label: "Documents" },
    { id: "cs_reports", label: "Reports" },
  ],
  finance: [
    { id: "fin_dashboard", label: "Dashboard" },
    { id: "fin_expenses", label: "Expenses" },
    { id: "fin_transactions", label: "Transactions" },
    { id: "fin_budget", label: "Budget Tracking" },
  ],
  hr: [
    { id: "hr_dashboard", label: "Dashboard" },
    { id: "hr_employees", label: "Employees" },
    { id: "hr_attendance", label: "Attendance" },
    { id: "hr_leave", label: "Leave Requests" },
    { id: "hr_payroll", label: "Payroll" },
    { id: "hr_payroll_proc", label: "Payroll Processing" },
    { id: "hr_config", label: "HR Configuration" },
    { id: "hr_reports", label: "Reports" },
  ],
  procurement: [
    { id: "pro_dashboard", label: "Dashboard" },
    { id: "pro_inventory", label: "Inventory" },
    { id: "pro_purchase_req", label: "Purchase Requests" },
    { id: "pro_purchase_ord", label: "Purchase Orders" },
    { id: "pro_suppliers", label: "Suppliers" },
    { id: "pro_reports", label: "Reports" },
  ],
  admin: [
    { id: "adm_users", label: "Users" },
    { id: "adm_roles", label: "Roles & Permissions" },
    { id: "adm_company", label: "Company Profile" },
    { id: "adm_audit", label: "Audit Logs" },
    { id: "adm_reports", label: "Report Builder" },
  ],
  ess: [
    { id: "ess_dashboard", label: "Dashboard" },
    { id: "ess_requests", label: "My Requests" },
    { id: "ess_submit", label: "Submit Request" },
    { id: "ess_projects", label: "My Projects" },
    { id: "ess_tasks", label: "My Tasks" },
    { id: "ess_profile", label: "My Profile" },
  ],
};

// ── Default nav access helpers ────────────────────────────────────────────────
function navAll(...apps: AppKey[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  apps.forEach((app) =>
    NAV_ITEMS[app].forEach((item) => {
      result[item.id] = true;
    }),
  );
  return result;
}

function navPartial(items: string[]): Record<string, boolean> {
  return Object.fromEntries(
    Object.values(NAV_ITEMS)
      .flat()
      .map((n) => [n.id, items.includes(n.id)]),
  );
}

// ── Default process catalog ────────────────────────────────────────────────────
const DEFAULT_PROCESSES: ProcessDef[] = [
  { id: "p_create_pr", label: "Create Purchase Request", app: "procurement" },
  { id: "p_approve_po", label: "Approve Purchase Order", app: "procurement" },
  { id: "p_issue_mat", label: "Issue Materials", app: "procurement" },
  { id: "p_create_exp", label: "Create Expense", app: "finance" },
  { id: "p_approve_exp", label: "Approve Expense", app: "finance" },
  { id: "p_create_pay", label: "Create Payroll", app: "hr" },
  { id: "p_approve_lv", label: "Approve Leave Request", app: "hr" },
  { id: "p_assign_wf", label: "Assign Workforce", app: "construction" },
  { id: "p_create_proj", label: "Create Project", app: "construction" },
  { id: "p_approve_bud", label: "Approve Project Budget", app: "construction" },
  { id: "p_gen_rpt", label: "Generate Reports", app: "admin" },
  { id: "p_manage_usr", label: "Manage Users", app: "admin" },
];

const ALL_PROC = (granted: string[]): Record<string, ProcessPerm> =>
  Object.fromEntries(
    DEFAULT_PROCESSES.map((p) => [
      p.id,
      {
        view: granted.includes(`${p.id}_v`),
        create: granted.includes(`${p.id}_c`),
        edit: granted.includes(`${p.id}_e`),
        approve: granted.includes(`${p.id}_a`),
        delete: granted.includes(`${p.id}_d`),
      },
    ]),
  );

// ── Helpers ───────────────────────────────────────────────────────────────────
const PERM_KEYS: Array<keyof ProcessPerm> = [
  "view",
  "create",
  "edit",
  "approve",
  "delete",
];
const PERM_SHORT: Record<keyof ProcessPerm, string> = {
  view: "V",
  create: "C",
  edit: "E",
  approve: "A",
  delete: "D",
};

function emptyPerm(): ProcessPerm {
  return {
    view: false,
    create: false,
    edit: false,
    approve: false,
    delete: false,
  };
}

// ── AddProcessModal ───────────────────────────────────────────────────────────
function AddProcessModal({
  existing,
  onAdd,
  onClose,
}: {
  existing: ProcessDef[];
  onAdd: (p: ProcessDef) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [app, setApp] = useState<AppKey>("construction");

  const available = DEFAULT_PROCESSES.filter(
    (p) => !existing.find((e) => e.id === p.id),
  );

  const [mode, setMode] = useState<"catalog" | "custom">("catalog");
  const [catalogId, setCatalogId] = useState(available[0]?.id ?? "");

  const handleAdd = () => {
    if (mode === "catalog" && catalogId) {
      const proc = DEFAULT_PROCESSES.find((p) => p.id === catalogId);
      if (proc) {
        onAdd(proc);
        onClose();
      }
    } else if (mode === "custom" && label.trim()) {
      onAdd({ id: `custom_${Date.now()}`, label: label.trim(), app });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Add Process Column
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Add a process to the permission matrix
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            {(["catalog", "custom"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${mode === m ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              >
                {m === "catalog" ? "From Catalog" : "Custom Process"}
              </button>
            ))}
          </div>
          {mode === "catalog" ? (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Select Process
              </label>
              {available.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">
                  All catalog processes have been added.
                </p>
              ) : (
                <select
                  value={catalogId}
                  onChange={(e) => setCatalogId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{APP_LABELS[p.app]}] {p.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Process Label
                </label>
                <input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Submit Site Report"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Application
                </label>
                <select
                  value={app}
                  onChange={(e) => setApp(e.target.value as AppKey)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {(Object.keys(APP_LABELS) as AppKey[]).map((k) => (
                    <option key={k} value={k}>
                      {APP_LABELS[k]}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={mode === "catalog" && available.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              Add Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── AddRoleModal ──────────────────────────────────────────────────────────────
function AddRoleModal({
  onAdd,
  onClose,
}: {
  onAdd: (data: { name: string; description: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      await onAdd({ name: name.trim(), description: desc.trim() });
      onClose();
    } catch {
      setError("Failed to create role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">
            Create New Role
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Role Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Site Supervisor"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Description
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={2}
              placeholder="Brief role description…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Creating…" : "Create Role"}
            </button>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleStatus, setRoleStatus] = useState<Record<string, "saving" | "saved" | "error">>({});

  const rolePayload = (role: Role) => ({
    name: role.name,
    description: role.description,
    isSuper: !!role.isSuper,
    permissions: {
      processPermissions: role.permissions,
      appAccess: role.appAccess,
      navAccess: role.navAccess,
    },
  });

  useEffect(() => {
    getAppRoles().then((apiRoles) => {
      setRoles((prev) =>
        apiRoles.map((r) => {
          const persisted =
            r.permissions &&
            typeof r.permissions === "object" &&
            !Array.isArray(r.permissions)
              ? (r.permissions as {
                  processPermissions?: Record<string, ProcessPerm>;
                  appAccess?: Record<AppKey, boolean>;
                  navAccess?: Record<string, boolean>;
                })
              : {};
          const existing = prev.find((p) => p.id === r.id);
          if (existing) return { ...existing, name: r.name };
          return {
            id: r.id,
            name: r.name,
            description: r.description ?? "",
            users: 0,
            isSuper: Boolean(r.isSuper ?? r.isSystem),
            permissions: persisted.processPermissions ?? {},
            appAccess: {
              construction: false,
              finance: false,
              hr: false,
              procurement: false,
              admin: Boolean(r.isSuper ?? r.isSystem),
              ess: false,
              ...(persisted.appAccess ?? {}),
            },
            navAccess: persisted.navAccess ?? {},
          } as Role;
        }),
      );
    });
  }, []);
  const [processes, setProcesses] = useState<ProcessDef[]>(
    DEFAULT_PROCESSES.slice(0, 8),
  );
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [showAddRole, setShowAddRole] = useState(false);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const [expandedRoleTab, setExpandedRoleTab] = useState<
    Record<string, "app" | "nav">
  >({});

  // Group shown processes by app
  const processesByApp = (
    Array.from(new Set(processes.map((p) => p.app))) as AppKey[]
  ).map((app) => ({
    app,
    items: processes.filter((p) => p.app === app),
  }));

  const updateAndPersistRole = (
    roleId: string,
    transform: (role: Role) => Role,
  ) => {
    let nextRole: Role | null = null;
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        nextRole = transform(r);
        return nextRole;
      }),
    );
    if (nextRole) {
      setRoleStatus((s) => ({ ...s, [roleId]: "saving" }));
      updateAppRole((nextRole as Role).id, rolePayload(nextRole as Role))
        .then(() => {
          setRoleStatus((s) => ({ ...s, [roleId]: "saved" }));
          setTimeout(
            () =>
              setRoleStatus((s) => {
                const copy = { ...s };
                delete copy[roleId];
                return copy;
              }),
            2000,
          );
        })
        .catch(() => {
          setRoleStatus((s) => ({ ...s, [roleId]: "error" }));
        });
    }
  };

  const togglePerm = (
    roleId: string,
    procId: string,
    key: keyof ProcessPerm,
  ) => {
    updateAndPersistRole(roleId, (r) => ({
      ...r,
      permissions: {
        ...r.permissions,
        [procId]: {
          ...r.permissions[procId],
          [key]: !r.permissions[procId]?.[key],
        },
      },
    }));
  };

  const toggleAppAccess = (roleId: string, app: AppKey) => {
    updateAndPersistRole(roleId, (r) => ({
      ...r,
      appAccess: { ...r.appAccess, [app]: !r.appAccess[app] },
    }));
  };

  const toggleNavAccess = (roleId: string, navId: string) => {
    updateAndPersistRole(roleId, (r) => ({
      ...r,
      navAccess: { ...r.navAccess, [navId]: !r.navAccess[navId] },
    }));
  };

  const removeProcess = (procId: string) => {
    setProcesses((prev) => prev.filter((p) => p.id !== procId));
  };

  const duplicateRole = async (role: Role) => {
    const permissions = { ...role.permissions };
    const appAccess = { ...role.appAccess };
    const navAccess = { ...role.navAccess };
    try {
      const created = await createAppRole({
        name: `${role.name} (Copy)`,
        description: role.description,
        isSuper: false,
        permissions: {
          processPermissions: permissions,
          appAccess,
          navAccess,
        },
      });
      setRoles((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          description: created.description ?? "",
          users: 0,
          isSuper: false,
          permissions,
          appAccess,
          navAccess,
        },
      ]);
    } catch {
      // silently ignore — server may reject duplicate names
    }
  };

  const deleteRole = async (roleId: string) => {
    const previous = roles;
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    try {
      await deleteAppRole(roleId);
    } catch {
      setRoles(previous);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Roles & Permissions
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Process-based permission matrix — rows are roles, columns are
            processes
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddProcess(true)}
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Select Process
          </button>
          <button
            onClick={() => setShowAddRole(true)}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Shield className="w-4 h-4" />
            New Role
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5">
        {PERM_KEYS.map((k) => (
          <span key={k} className="flex items-center gap-1">
            <span className="w-5 h-5 rounded bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
              {PERM_SHORT[k]}
            </span>
            {k.charAt(0).toUpperCase() + k.slice(1)}
          </span>
        ))}
        <span className="ml-2 text-gray-400">
          Click any cell to toggle permission
        </span>
      </div>

      {/* Matrix — horizontally scrollable */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse">
            <thead>
              {/* Row 1: App group headers */}
              <tr className="bg-gray-50 border-b border-gray-200">
                <th
                  rowSpan={3}
                  className="sticky left-0 z-20 bg-gray-50 px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide border-r border-gray-200 min-w-[200px] align-bottom"
                >
                  Role
                </th>
                {processesByApp.map(({ app, items }) => (
                  <th
                    key={app}
                    colSpan={items.length * PERM_KEYS.length}
                    className={`px-3 py-2 text-center text-xs font-semibold border-r border-gray-200 ${APP_COLORS[app]}`}
                  >
                    {APP_LABELS[app]}
                  </th>
                ))}
              </tr>
              {/* Row 2: Process name headers */}
              <tr className="bg-gray-50 border-b border-gray-100">
                {processes.map((proc, pi) => (
                  <th
                    key={proc.id}
                    colSpan={PERM_KEYS.length}
                    className={`px-2 py-1.5 text-center text-xs font-medium text-gray-600 whitespace-nowrap group ${
                      pi < processes.length - 1
                        ? "border-r border-gray-200"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-1 justify-center">
                      <span
                        className="truncate max-w-[110px]"
                        title={proc.label}
                      >
                        {proc.label}
                      </span>
                      <button
                        onClick={() => removeProcess(proc.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-opacity ml-0.5"
                        title="Remove process column"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
              {/* Row 3: V / C / E / A / D sub-headers */}
              <tr className="bg-gray-50 border-b border-gray-200">
                {processes.map((proc, pi) =>
                  PERM_KEYS.map((k, ki) => (
                    <th
                      key={`${proc.id}_${k}`}
                      className={`w-7 py-1.5 text-center text-[10px] font-semibold text-gray-400 uppercase ${
                        ki === PERM_KEYS.length - 1 && pi < processes.length - 1
                          ? "border-r border-gray-200"
                          : ""
                      }`}
                      title={k}
                    >
                      {PERM_SHORT[k]}
                    </th>
                  )),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {roles.map((role) => (
                <Fragment key={role.id}>
                  <tr key={role.id} className="hover:bg-gray-50/70 group">
                    {/* Role name cell — sticky */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-gray-50/70 border-r border-gray-200 px-5 py-3 min-w-[200px]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() =>
                              setExpandedRoleId(
                                expandedRoleId === role.id ? null : role.id,
                              )
                            }
                            className="text-gray-400 hover:text-gray-600 shrink-0"
                          >
                            {expandedRoleId === role.id ? (
                              <ChevronDown className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium text-gray-900 truncate">
                                {role.name}
                              </span>
                              {role.isSuper && (
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-1 rounded font-medium shrink-0">
                                  Super
                                </span>
                              )}
                              {roleStatus[role.id] === "saving" && (
                                <span className="text-[10px] text-gray-400 shrink-0">saving…</span>
                              )}
                              {roleStatus[role.id] === "saved" && (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              )}
                              {roleStatus[role.id] === "error" && (
                                <span className="text-[10px] text-red-500 shrink-0 flex items-center gap-0.5">
                                  <XCircle className="w-3 h-3" /> Save failed
                                </span>
                              )}
                            </div>
                            <span className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                              <Users className="w-3 h-3" />
                              {role.users}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 shrink-0">
                          <button
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            title="Edit"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => void duplicateRole(role)}
                            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                            title="Duplicate"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          {!role.isSuper && (
                            <button
                              onClick={() => void deleteRole(role.id)}
                              className="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Permission cells — one td per perm key per process */}
                    {processes.map((proc, pi) =>
                      PERM_KEYS.map((k, ki) => {
                        const val = role.permissions[proc.id]?.[k] ?? false;
                        return (
                          <td
                            key={`${proc.id}_${k}`}
                            className={`py-3 text-center ${
                              ki === PERM_KEYS.length - 1 &&
                              pi < processes.length - 1
                                ? "border-r border-gray-100"
                                : ""
                            }`}
                          >
                            <button
                              onClick={() =>
                                !role.isSuper && togglePerm(role.id, proc.id, k)
                              }
                              disabled={role.isSuper}
                              title={`${k} — ${proc.label}`}
                              className={`w-6 h-6 rounded text-[10px] font-bold transition-colors mx-auto flex items-center justify-center ${
                                val
                                  ? "bg-indigo-600 text-white"
                                  : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                              } ${role.isSuper ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {PERM_SHORT[k]}
                            </button>
                          </td>
                        );
                      }),
                    )}
                  </tr>

                  {/* Expanded row: 3-layer permission panel */}
                  {expandedRoleId === role.id && (
                    <tr
                      key={`${role.id}_exp`}
                      className="bg-indigo-50/40 border-b border-indigo-100"
                    >
                      <td
                        colSpan={processes.length * PERM_KEYS.length + 1}
                        className="px-5 py-4"
                      >
                        {/* Panel header + description */}
                        <p className="text-xs text-gray-500 italic mb-3">
                          {role.description}
                        </p>

                        {/* Layer tabs */}
                        <div className="flex gap-1 mb-4 border-b border-indigo-100">
                          {(["app", "nav"] as const).map((tabKey) => (
                            <button
                              key={tabKey}
                              onClick={() =>
                                setExpandedRoleTab((t) => ({
                                  ...t,
                                  [role.id]: tabKey,
                                }))
                              }
                              className={`px-3 py-1.5 text-xs font-medium rounded-t border-b-2 -mb-px transition-colors ${
                                (expandedRoleTab[role.id] ?? "app") === tabKey
                                  ? "border-indigo-600 text-indigo-700 bg-white"
                                  : "border-transparent text-gray-500 hover:text-gray-700"
                              }`}
                            >
                              {tabKey === "app"
                                ? "Layer 1 — App Access"
                                : "Layer 2 — Navigation"}
                            </button>
                          ))}
                          <span className="px-3 py-1.5 text-xs text-gray-400 ml-auto italic">
                            Layer 3 — Process Permissions visible in matrix
                            above
                          </span>
                        </div>

                        {/* Layer 1: Application Access */}
                        {(expandedRoleTab[role.id] ?? "app") === "app" && (
                          <div className="grid grid-cols-6 gap-3">
                            {(Object.keys(APP_LABELS) as AppKey[]).map(
                              (app) => {
                                const granted = role.appAccess[app];
                                return (
                                  <button
                                    key={app}
                                    onClick={() =>
                                      !role.isSuper &&
                                      toggleAppAccess(role.id, app)
                                    }
                                    disabled={role.isSuper}
                                    className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 text-center transition-colors ${
                                      granted
                                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                                        : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                                    } ${role.isSuper ? "cursor-not-allowed" : "cursor-pointer"}`}
                                  >
                                    <span
                                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${APP_COLORS[app]}`}
                                    >
                                      {APP_LABELS[app]}
                                    </span>
                                    <span className="text-xs">
                                      {granted ? "✓ Access" : "No Access"}
                                    </span>
                                  </button>
                                );
                              },
                            )}
                          </div>
                        )}

                        {/* Layer 2: Navigation Access */}
                        {(expandedRoleTab[role.id] ?? "app") === "nav" && (
                          <div className="grid grid-cols-3 gap-4">
                            {(Object.keys(NAV_ITEMS) as AppKey[])
                              .filter((app) => role.appAccess[app])
                              .map((app) => (
                                <div key={app} className="space-y-1.5">
                                  <p
                                    className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${APP_COLORS[app]}`}
                                  >
                                    {APP_LABELS[app]}
                                  </p>
                                  <div className="space-y-1">
                                    {NAV_ITEMS[app].map((item) => {
                                      const granted =
                                        role.navAccess[item.id] ?? false;
                                      return (
                                        <label
                                          key={item.id}
                                          className={`flex items-center gap-2 text-xs cursor-pointer ${role.isSuper ? "cursor-not-allowed" : ""}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={granted}
                                            onChange={() =>
                                              !role.isSuper &&
                                              toggleNavAccess(role.id, item.id)
                                            }
                                            disabled={role.isSuper}
                                            className="rounded accent-indigo-600 w-3 h-3"
                                          />
                                          <span
                                            className={
                                              granted
                                                ? "text-gray-700"
                                                : "text-gray-400"
                                            }
                                          >
                                            {item.label}
                                          </span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            {(Object.keys(NAV_ITEMS) as AppKey[]).filter(
                              (app) => !role.appAccess[app],
                            ).length > 0 && (
                              <div className="col-span-3 text-xs text-gray-400 italic">
                                {(Object.keys(NAV_ITEMS) as AppKey[])
                                  .filter((app) => !role.appAccess[app])
                                  .map((a) => APP_LABELS[a])
                                  .join(", ")}{" "}
                                app(s) not accessible — grant app access in
                                Layer 1 first.
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {processes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-center bg-white rounded-xl border border-dashed border-gray-300">
          <AlertCircle className="w-8 h-8 text-gray-300" />
          <p className="text-sm text-gray-500">No processes added yet.</p>
          <button
            onClick={() => setShowAddProcess(true)}
            className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium hover:underline"
          >
            <Plus className="w-4 h-4" /> Select Process
          </button>
        </div>
      )}

      {/* Modals */}
      {showAddProcess && (
        <AddProcessModal
          existing={processes}
          onAdd={(p) => setProcesses((prev) => [...prev, p])}
          onClose={() => setShowAddProcess(false)}
        />
      )}
      {showAddRole && (
        <AddRoleModal
          onAdd={async ({ name, description }) => {
            const appAccess = {
              construction: false,
              finance: false,
              hr: false,
              procurement: false,
              admin: false,
              ess: true,
            };
            const permissions = Object.fromEntries(
              DEFAULT_PROCESSES.map((p) => [p.id, emptyPerm()]),
            );
            const navAccess = navPartial([
              "ess_dashboard",
              "ess_requests",
              "ess_submit",
              "ess_profile",
            ]);

            const created = await createAppRole({
              name,
              description,
              isSuper: false,
              permissions: {
                processPermissions: permissions,
                appAccess,
                navAccess,
              },
            });
            setRoles((prev) => [
              ...prev,
              {
                id: created.id,
                name: created.name,
                description: created.description ?? "",
                users: 0,
                isSuper: Boolean(created.isSuper ?? created.isSystem),
                permissions,
                appAccess,
                navAccess,
              },
            ]);
          }}
          onClose={() => setShowAddRole(false)}
        />
      )}
    </div>
  );
}
