import { useState, useEffect } from "react";
import { getUsers, AppUser } from "../../api/admin-extras";
import {
  Search,
  Plus,
  Shield,
  MoreVertical,
  X,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Edit,
  Copy,
  Trash2,
  AlertCircle,
  Lock,
  Eye,
  PenLine,
  BadgeCheck,
  UserCheck,
  Upload,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────
type AppKey =
  | "construction"
  | "finance"
  | "hr"
  | "procurement"
  | "admin"
  | "ess";
type UserStatus = "Active" | "Inactive" | "Pending";
type PermState = "allow" | "deny" | "inherit";

interface AppDef {
  key: AppKey;
  label: string;
  color: string;
  abbr: string;
}
const ALL_APPS: AppDef[] = [
  {
    key: "construction",
    label: "Construction",
    color: "bg-orange-100 text-orange-700",
    abbr: "CONST",
  },
  {
    key: "finance",
    label: "Finance",
    color: "bg-emerald-100 text-emerald-700",
    abbr: "FIN",
  },
  {
    key: "hr",
    label: "HR",
    color: "bg-purple-100 text-purple-700",
    abbr: "HR",
  },
  {
    key: "procurement",
    label: "Procurement",
    color: "bg-blue-100 text-blue-700",
    abbr: "PROC",
  },
  {
    key: "admin",
    label: "Admin",
    color: "bg-indigo-100 text-indigo-700",
    abbr: "ADMIN",
  },
  { key: "ess", label: "ESS", color: "bg-teal-100 text-teal-700", abbr: "ESS" },
];

interface Process {
  id: string;
  label: string;
  app: AppKey;
  permissions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    approve: boolean;
    delete: boolean;
  };
}

interface ActivityEntry {
  date: string;
  action: string;
  module: string;
  app: AppKey;
}
interface RequestEntry {
  type: "submitted" | "approved" | "rejected";
  label: string;
  date: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  department: string;
  joinDate: string;
  status: UserStatus;
  apps: AppKey[];
  lastActive: string;
  processes: Process[];
  activity: ActivityEntry[];
  requests: RequestEntry[];
  hasSignature?: boolean;
  signatureInitials?: string;
}

// ── Mock Processes template ──────────────────────────────────────────────────
const buildProcesses = (allow: string[]): Process[] => [
  {
    id: "p1",
    label: "Create Purchase Request",
    app: "procurement",
    permissions: {
      view: allow.includes("p1_v"),
      create: allow.includes("p1_c"),
      edit: allow.includes("p1_e"),
      approve: allow.includes("p1_a"),
      delete: allow.includes("p1_d"),
    },
  },
  {
    id: "p2",
    label: "Approve Purchase Order",
    app: "procurement",
    permissions: {
      view: true,
      create: false,
      edit: false,
      approve: allow.includes("p2_a"),
      delete: false,
    },
  },
  {
    id: "p3",
    label: "Issue Materials",
    app: "procurement",
    permissions: {
      view: true,
      create: allow.includes("p3_c"),
      edit: false,
      approve: false,
      delete: false,
    },
  },
  {
    id: "p4",
    label: "Create Expense",
    app: "finance",
    permissions: {
      view: true,
      create: allow.includes("p4_c"),
      edit: allow.includes("p4_e"),
      approve: false,
      delete: false,
    },
  },
  {
    id: "p5",
    label: "Approve Expense",
    app: "finance",
    permissions: {
      view: true,
      create: false,
      edit: false,
      approve: allow.includes("p5_a"),
      delete: false,
    },
  },
  {
    id: "p6",
    label: "Create Payroll",
    app: "hr",
    permissions: {
      view: allow.includes("p6_v"),
      create: allow.includes("p6_c"),
      edit: false,
      approve: false,
      delete: false,
    },
  },
  {
    id: "p7",
    label: "Approve Leave Request",
    app: "hr",
    permissions: {
      view: true,
      create: false,
      edit: false,
      approve: allow.includes("p7_a"),
      delete: false,
    },
  },
  {
    id: "p8",
    label: "Assign Workforce",
    app: "construction",
    permissions: {
      view: true,
      create: allow.includes("p8_c"),
      edit: allow.includes("p8_e"),
      approve: false,
      delete: false,
    },
  },
  {
    id: "p9",
    label: "Create Project",
    app: "construction",
    permissions: {
      view: true,
      create: allow.includes("p9_c"),
      edit: allow.includes("p9_e"),
      approve: false,
      delete: false,
    },
  },
  {
    id: "p10",
    label: "Approve Project Budget",
    app: "construction",
    permissions: {
      view: true,
      create: false,
      edit: false,
      approve: allow.includes("p10_a"),
      delete: false,
    },
  },
  {
    id: "p11",
    label: "Generate Reports",
    app: "admin",
    permissions: {
      view: true,
      create: allow.includes("p11_c"),
      edit: false,
      approve: false,
      delete: false,
    },
  },
  {
    id: "p12",
    label: "Manage Users",
    app: "admin",
    permissions: {
      view: allow.includes("p12_v"),
      create: allow.includes("p12_c"),
      edit: allow.includes("p12_e"),
      approve: false,
      delete: allow.includes("p12_d"),
    },
  },
];

// ── API → UserRecord mapper ─────────────────────────────────────────────────
function userFromApi(u: AppUser): UserRecord {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: "",
    location: "",
    role: u.role,
    department: u.department ?? "",
    joinDate: u.createdAt
      ? new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
    status: u.isActive ? "Active" : "Inactive",
    apps: [],
    lastActive: u.lastLogin
      ? new Date(u.lastLogin).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Never",
    processes: [],
    activity: [],
    requests: [],
  };
}

/* legacy seed removed — was const mockUsers: UserRecord[] = [ */
const _LEGACY_SEED_USERS: UserRecord[] = [
  {
    id: "USR-001",
    name: "Amaka Osei",
    email: "amaka.osei@buildos.com",
    phone: "+234 801 234 5678",
    location: "Lagos",
    role: "Admin",
    department: "IT",
    joinDate: "Jan 12, 2022",
    status: "Active",
    apps: ["admin", "hr", "construction", "finance", "procurement", "ess"],
    lastActive: "2 minutes ago",
    processes: buildProcesses([
      "p1_v",
      "p1_c",
      "p1_e",
      "p1_a",
      "p1_d",
      "p2_a",
      "p3_c",
      "p4_c",
      "p4_e",
      "p5_a",
      "p6_v",
      "p6_c",
      "p7_a",
      "p8_c",
      "p8_e",
      "p9_c",
      "p9_e",
      "p10_a",
      "p11_c",
      "p12_v",
      "p12_c",
      "p12_e",
      "p12_d",
    ]),
    activity: [
      {
        date: "Apr 10, 2026 09:14",
        action: "Created user Chukwudi Eze",
        module: "Users",
        app: "admin",
      },
      {
        date: "Apr 10, 2026 08:55",
        action: "Updated project Lekki Tower A",
        module: "Projects",
        app: "construction",
      },
      {
        date: "Apr 9, 2026  17:30",
        action: "Approved expense EXP-0041",
        module: "Expenses",
        app: "finance",
      },
    ],
    requests: [
      {
        type: "approved",
        label: "Budget Increase — Lekki Tower A",
        date: "Apr 9, 2026",
      },
      { type: "submitted", label: "Q2 Payroll Run", date: "Apr 8, 2026" },
    ],
  },
  {
    id: "USR-002",
    name: "Chukwudi Eze",
    email: "c.eze@buildos.com",
    phone: "+234 802 345 6789",
    location: "Abuja",
    role: "Construction Manager",
    department: "Construction",
    joinDate: "Mar 5, 2023",
    status: "Active",
    apps: ["construction", "procurement", "ess"],
    lastActive: "1 hour ago",
    processes: buildProcesses(["p8_c", "p8_e", "p9_c", "p9_e", "p3_c", "p1_v"]),
    activity: [
      {
        date: "Apr 10, 2026 07:45",
        action: "Assigned workforce to Project 003",
        module: "Workforce",
        app: "construction",
      },
      {
        date: "Apr 9, 2026  15:20",
        action: "Submitted purchase request PR-0112",
        module: "Procurement",
        app: "procurement",
      },
    ],
    requests: [
      {
        type: "submitted",
        label: "Purchase Request PR-0112",
        date: "Apr 9, 2026",
      },
      {
        type: "rejected",
        label: "Equipment Hire — Crane",
        date: "Apr 7, 2026",
      },
    ],
  },
  {
    id: "USR-003",
    name: "Sola Adeleke",
    email: "s.adeleke@buildos.com",
    phone: "+234 803 456 7890",
    location: "Ibadan",
    role: "Accountant",
    department: "Finance",
    joinDate: "Jun 20, 2023",
    status: "Active",
    apps: ["finance", "ess"],
    lastActive: "30 minutes ago",
    processes: buildProcesses(["p4_c", "p4_e", "p5_a", "p6_v", "p11_c"]),
    activity: [
      {
        date: "Apr 10, 2026 09:00",
        action: "Approved expense EXP-0050",
        module: "Expenses",
        app: "finance",
      },
      {
        date: "Apr 9, 2026  11:30",
        action: "Generated monthly report",
        module: "Reports",
        app: "admin",
      },
    ],
    requests: [
      { type: "approved", label: "Expense EXP-0050", date: "Apr 10, 2026" },
    ],
  },
  {
    id: "USR-004",
    name: "Musa Ibrahim",
    email: "m.ibrahim@buildos.com",
    phone: "+234 804 567 8901",
    location: "Kano",
    role: "Store Manager",
    department: "Procurement",
    joinDate: "Nov 3, 2022",
    status: "Active",
    apps: ["procurement", "ess"],
    lastActive: "5 hours ago",
    processes: buildProcesses(["p1_v", "p1_c", "p2_a", "p3_c"]),
    activity: [
      {
        date: "Apr 10, 2026 06:30",
        action: "Received delivery PO-2026-0041",
        module: "Purchase Orders",
        app: "procurement",
      },
    ],
    requests: [
      {
        type: "submitted",
        label: "Purchase Order PO-2026-0044",
        date: "Apr 8, 2026",
      },
    ],
  },
  {
    id: "USR-005",
    name: "Ngozi Okafor",
    email: "n.okafor@buildos.com",
    phone: "+234 805 678 9012",
    location: "Lagos",
    role: "HR Manager",
    department: "Human Resources",
    joinDate: "Feb 14, 2021",
    status: "Active",
    apps: ["hr", "ess"],
    lastActive: "Yesterday",
    processes: buildProcesses(["p6_v", "p6_c", "p7_a"]),
    activity: [
      {
        date: "Apr 9, 2026  16:00",
        action: "Processed April payroll",
        module: "Payroll",
        app: "hr",
      },
    ],
    requests: [
      {
        type: "submitted",
        label: "Payroll Processing — April 2026",
        date: "Apr 9, 2026",
      },
    ],
  },
  {
    id: "USR-006",
    name: "Tunde Bello",
    email: "t.bello@buildos.com",
    phone: "+234 806 789 0123",
    location: "Lagos",
    role: "Employee",
    department: "Engineering",
    joinDate: "Aug 1, 2024",
    status: "Pending",
    apps: ["ess"],
    lastActive: "3 hours ago",
    processes: buildProcesses([]),
    activity: [],
    requests: [
      {
        type: "submitted",
        label: "Leave Request — Annual Leave",
        date: "Apr 8, 2026",
      },
    ],
  },
  {
    id: "USR-007",
    name: "Fatima Yusuf",
    email: "f.yusuf@buildos.com",
    phone: "+234 807 890 1234",
    location: "Abuja",
    role: "Finance Manager",
    department: "Finance",
    joinDate: "May 10, 2020",
    status: "Active",
    apps: ["finance", "procurement", "ess"],
    lastActive: "4 hours ago",
    processes: buildProcesses([
      "p4_c",
      "p4_e",
      "p5_a",
      "p6_v",
      "p6_c",
      "p1_v",
      "p2_a",
      "p11_c",
    ]),
    activity: [
      {
        date: "Apr 10, 2026 08:10",
        action: "Reviewed monthly expenditure",
        module: "Finance",
        app: "finance",
      },
    ],
    requests: [
      {
        type: "approved",
        label: "Expense Batch — Apr Week 1",
        date: "Apr 9, 2026",
      },
    ],
  },
  {
    id: "USR-008",
    name: "Emeka Nwosu",
    email: "e.nwosu@buildos.com",
    phone: "+234 808 901 2345",
    location: "Port Harcourt",
    role: "Site Engineer",
    department: "Construction",
    joinDate: "Sep 22, 2023",
    status: "Inactive",
    apps: [],
    lastActive: "2 weeks ago",
    processes: buildProcesses([]),
    activity: [],
    requests: [],
  },
];
// _LEGACY_SEED_USERS kept for reference but not used — component fetches from API

// ── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<UserStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Inactive: "bg-gray-100 text-gray-500",
  Pending: "bg-amber-100 text-amber-700",
};
const PERM_ACTIONS: Array<{
  key: keyof Process["permissions"];
  label: string;
  Icon: React.FC<{ className?: string }>;
}> = [
  { key: "view", label: "View", Icon: Eye },
  { key: "create", label: "Create", Icon: Plus },
  { key: "edit", label: "Edit", Icon: PenLine },
  { key: "approve", label: "Approve", Icon: BadgeCheck },
  { key: "delete", label: "Delete", Icon: Trash2 },
];

function AppBadge({
  appKey,
  size = "sm",
}: {
  appKey: AppKey;
  size?: "sm" | "xs";
}) {
  const app = ALL_APPS.find((a) => a.key === appKey);
  if (!app) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${app.color} ${size === "xs" ? "text-[10px]" : ""}`}
    >
      {size === "sm" ? app.label : app.abbr}
    </span>
  );
}

// ── User Detail Slide-over ───────────────────────────────────────────────────
function UserDetailPanel({
  user,
  onClose,
  onUpdateSignature,
}: {
  user: UserRecord;
  onClose: () => void;
  onUpdateSignature: (id: string, has: boolean, initials?: string) => void;
}) {
  const [tab, setTab] = useState<
    "info" | "apps" | "permissions" | "activity" | "requests" | "signature"
  >("info");
  const [signatureInitials, setSignatureInitials] = useState(
    user.signatureInitials ??
      user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 3),
  );
  const [hasSignature, setHasSignature] = useState(user.hasSignature ?? false);
  const [uploadSimulated, setUploadSimulated] = useState(false);

  const tabs = [
    { key: "info", label: "Basic Info" },
    { key: "apps", label: "App Access" },
    { key: "permissions", label: "Permissions" },
    { key: "activity", label: "Activity" },
    { key: "requests", label: "Requests" },
  ] as const;

  // Group processes by app
  const processesByApp = ALL_APPS.map((app) => ({
    app,
    processes: user.processes.filter((p) => p.app === app.key),
  })).filter((g) => g.processes.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div className="flex-1 bg-black/30" onClick={onClose} />
      {/* Panel */}
      <div className="w-[640px] bg-white border-l border-gray-200 flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4 shrink-0">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
            {user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900 truncate">
                {user.name}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_COLOR[user.status]}`}
              >
                {user.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {user.role} · {user.department}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 shrink-0 px-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-2.5 px-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? "border-indigo-500 text-indigo-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ── Basic Info ── */}
          {tab === "info" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { Icon: Mail, label: "Email", value: user.email },
                  { Icon: Phone, label: "Phone", value: user.phone },
                  { Icon: MapPin, label: "Location", value: user.location },
                  {
                    Icon: Briefcase,
                    label: "Department",
                    value: user.department,
                  },
                  { Icon: Shield, label: "Role", value: user.role },
                  { Icon: Calendar, label: "Joined", value: user.joinDate },
                ].map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">{label}</p>
                      <p className="text-sm font-medium text-gray-900 mt-0.5">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                <Activity className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="text-xs text-indigo-700">
                  Last active:{" "}
                  <span className="font-medium">{user.lastActive}</span>
                </span>
              </div>
            </div>
          )}

          {/* ── App Access ── */}
          {tab === "apps" && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-4">
                {user.apps.length === 0
                  ? "This user has no application access assigned."
                  : `${user.apps.length} of ${ALL_APPS.length} applications assigned.`}
              </p>
              {ALL_APPS.map((app) => {
                const has = user.apps.includes(app.key);
                return (
                  <div
                    key={app.key}
                    className={`flex items-center justify-between p-3 rounded-lg border ${has ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${app.color}`}
                      >
                        {app.abbr}
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {app.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {has ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs text-emerald-700 font-medium">
                            Assigned
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-gray-300" />
                          <span className="text-xs text-gray-400">
                            No access
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Permissions ── */}
          {tab === "permissions" && (
            <div className="space-y-6">
              <p className="text-xs text-gray-500">
                Process-level permissions across all applications.
              </p>
              {processesByApp.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">
                  No processes assigned to this user.
                </div>
              )}
              {processesByApp.map(({ app, processes }) => (
                <div key={app.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-semibold ${app.color}`}
                    >
                      {app.label}
                    </span>
                  </div>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-3 py-2 text-gray-500 font-medium">
                            Process
                          </th>
                          {PERM_ACTIONS.map((a) => (
                            <th
                              key={a.key}
                              className="px-2 py-2 text-gray-500 font-medium text-center"
                            >
                              {a.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {processes.map((proc) => (
                          <tr key={proc.id} className="hover:bg-gray-50/50">
                            <td className="px-3 py-2 text-gray-700 font-medium">
                              {proc.label}
                            </td>
                            {PERM_ACTIONS.map((a) => (
                              <td key={a.key} className="px-2 py-2 text-center">
                                {proc.permissions[a.key] ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-gray-200 mx-auto" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Activity ── */}
          {tab === "activity" && (
            <div className="space-y-2">
              {user.activity.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No activity recorded.
                </p>
              )}
              {user.activity.map((a, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                >
                  <div
                    className={`mt-[5px] w-1.5 h-1.5 rounded-full shrink-0 ${
                      ALL_APPS.find((ap) => ap.key === a.app)
                        ?.color.replace("text-", "bg-")
                        .split(" ")[0]
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{a.action}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <AppBadge appKey={a.app} size="xs" />
                      <span className="text-xs text-gray-400">{a.module}</span>
                      <span className="text-xs text-gray-300">·</span>
                      <span className="text-xs text-gray-400">{a.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Requests ── */}
          {tab === "requests" && (
            <div className="space-y-2">
              {user.requests.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">
                  No request history.
                </p>
              )}
              {user.requests.map((r, i) => {
                const cfg = {
                  submitted: {
                    icon: <Clock className="w-4 h-4 text-amber-500" />,
                    badge: "bg-amber-100 text-amber-700",
                    label: "Submitted",
                  },
                  approved: {
                    icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
                    badge: "bg-emerald-100 text-emerald-700",
                    label: "Approved",
                  },
                  rejected: {
                    icon: <XCircle className="w-4 h-4 text-red-400" />,
                    badge: "bg-red-100 text-red-700",
                    label: "Rejected",
                  },
                }[r.type];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
                  >
                    {cfg.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">
                        {r.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.date}</p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium shrink-0 ${cfg.badge}`}
                    >
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Signature ── */}
          {tab === "signature" && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  Digital Signature
                </p>
                <p className="text-xs text-gray-500">
                  Used on official documents: RFQs, Purchase Orders, Payment
                  Confirmations, and other outgoing documents. Signatures appear
                  in "Sent By" and "Approved By" sections.
                </p>
              </div>

              {/* Current signature display */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Current Signature
                </p>
                {hasSignature || uploadSimulated ? (
                  <div className="space-y-3">
                    {/* Signature preview — stylised initials as a simulated signature */}
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6 flex items-center justify-center min-h-[100px]">
                      <p
                        style={{ fontFamily: "cursive" }}
                        className="text-3xl text-gray-700 select-none"
                      >
                        {signatureInitials}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.role} · {user.department}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Signature on
                        file
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-2">
                    <PenLine className="w-8 h-8 text-gray-300" />
                    <p className="text-sm text-gray-400">
                      No signature uploaded yet
                    </p>
                    <p className="text-xs text-gray-400">
                      Upload a signature image or use the signature pad below
                    </p>
                  </div>
                )}
              </div>

              {/* Signature customisation */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Signature Text / Initials
                </p>
                <div className="flex items-center gap-3">
                  <input
                    value={signatureInitials}
                    onChange={(e) => setSignatureInitials(e.target.value)}
                    maxLength={8}
                    placeholder="e.g. A.O or signature text"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 min-w-[80px] text-center">
                    <p
                      style={{ fontFamily: "cursive" }}
                      className="text-lg text-gray-700"
                    >
                      {signatureInitials || "…"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upload simulation */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Upload Signature Image
                </p>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                  onClick={() => {
                    setUploadSimulated(true);
                  }}
                >
                  <PenLine className="w-5 h-5 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    Click to upload signature file{" "}
                    <span className="text-gray-400">
                      (PNG, JPG — white background preferred)
                    </span>
                  </p>
                  {uploadSimulated && (
                    <p className="text-xs text-green-600 font-medium">
                      ✓ signature_file.png uploaded
                    </p>
                  )}
                </div>
              </div>

              {/* Document section preview */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  How this appears on documents
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {["Sent By", "Approved By"].map((label) => (
                    <div
                      key={label}
                      className="bg-white border border-blue-100 rounded-lg p-3 space-y-1"
                    >
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        {label}
                      </p>
                      <div className="border-b border-gray-200 pb-2 mb-2">
                        <p
                          style={{ fontFamily: "cursive" }}
                          className="text-lg text-gray-600"
                        >
                          {signatureInitials || "…"}
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-gray-700">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3">
                {(hasSignature || uploadSimulated) && (
                  <button
                    onClick={() => {
                      setHasSignature(false);
                      setUploadSimulated(false);
                      onUpdateSignature(user.id, false);
                    }}
                    className="px-4 py-2 text-sm border border-red-200 rounded-xl text-red-600 hover:bg-red-50"
                  >
                    Remove Signature
                  </button>
                )}
                <button
                  onClick={() => {
                    onUpdateSignature(user.id, true, signatureInitials);
                    setHasSignature(true);
                  }}
                  className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2"
                >
                  <BadgeCheck className="w-4 h-4" /> Save Signature
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-3 border-t border-gray-100 flex items-center gap-2 shrink-0 bg-gray-50">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors">
            <Edit className="w-4 h-4" />
            Edit User
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors">
            <Lock className="w-4 h-4" />
            Reset Password
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors">
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <div className="flex-1" />
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-red-200 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export function UsersPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "all">("all");
  const [appFilter, setAppFilter] = useState<AppKey | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    getUsers().then((data) => setUsers(data.map(userFromApi))).catch(console.error);
  }, []);

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    const matchApp = appFilter === "all" || u.apps.includes(appFilter);
    return matchSearch && matchStatus && matchApp;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.status === "Active").length,
    pending: users.filter((u) => u.status === "Pending").length,
    inactive: users.filter((u) => u.status === "Inactive").length,
  };

  return (
    <div>
      {/* User Detail Modal */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdateSignature={() => {}}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage users, app access, and process-level permissions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Users", value: stats.total, color: "text-gray-900" },
          { label: "Active", value: stats.active, color: "text-emerald-600" },
          {
            label: "Pending Invite",
            value: stats.pending,
            color: "text-amber-500",
          },
          { label: "Inactive", value: stats.inactive, color: "text-gray-400" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
              {s.label}
            </p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search name, email, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as UserStatus | "all")
          }
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Pending">Pending</option>
          <option value="Inactive">Inactive</option>
        </select>
        <select
          value={appFilter}
          onChange={(e) => setAppFilter(e.target.value as AppKey | "all")}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Applications</option>
          {ALL_APPS.map((a) => (
            <option key={a.key} value={a.key}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                User
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Assigned Applications
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Last Active
              </th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setSelectedUser(user)}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700">{user.role}</span>
                    {user.hasSignature && (
                      <BadgeCheck
                        className="w-3.5 h-3.5 text-indigo-500 shrink-0"
                        aria-label="Signature on file"
                      />
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[user.status]}`}
                  >
                    {user.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  {user.apps.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">
                      No access
                    </span>
                  ) : (
                    <div className="flex items-center gap-1 flex-wrap">
                      {user.apps.slice(0, 4).map((a) => (
                        <AppBadge key={a} appKey={a} size="xs" />
                      ))}
                      {user.apps.length > 4 && (
                        <span className="text-xs text-gray-400">
                          +{user.apps.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-gray-500">
                    {user.lastActive}
                  </span>
                </td>
                <td
                  className="px-4 py-3.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative flex justify-end">
                    {/* ...existing code... */}
                    {/* FIX: Remove invalid </label> and stray JSX, ensure correct closing tags */}
                    <button
                      onClick={() =>
                        setOpenMenuId(openMenuId === user.id ? null : user.id)
                      }
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {/* Add any additional button content here if needed */}
                    </button>
                  </div>
                </td>
                {/* ...existing code... */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* ...existing code... */}
    </div>
  );
}
