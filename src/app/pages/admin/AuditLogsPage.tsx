import { Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { DataTable } from "../../components/DataTable";
import { getAuditLogs, getUsers } from "../../api/admin-extras";

const ACTION_LABELS: Record<string, string> = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  READ: "Viewed",
  LOGIN: "Login",
  APPROVE: "Approved",
  EXPORT: "Exported",
};

function normalizeAction(action: string): string {
  if (!action) return "Unknown";
  return ACTION_LABELS[action.toUpperCase()] ?? action;
}

interface AuditLog {
  id: string;
  timestamp: string;
  createdAt: string;
  user: string;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);

  useEffect(() => {
    Promise.all([getAuditLogs({ limit: 100 }), getUsers()])
      .then(([auditLogs, users]) => {
        setLogs(
          auditLogs.map((log: any) => ({
            id: String(log.id),
            timestamp: new Date(log.createdAt || log.timestamp).toLocaleString(),
            createdAt: String(log.createdAt || log.timestamp || ""),
            user:
              typeof log.user === "string"
                ? log.user
                : log.user?.name || log.userId || "System",
            action: normalizeAction(String(log.action || "Unknown")),
            module: String(
              log.module || log.resource || log.entity || "System",
            ),
            details: String(log.details || log.description || ""),
            ipAddress: String(log.ipAddress || "N/A"),
          })),
        );

        const since24h = Date.now() - 24 * 60 * 60 * 1000;
        setActiveUsers(
          users.filter((user) => {
            if (!user.lastLogin) return false;
            const at = new Date(user.lastLogin).getTime();
            return Number.isFinite(at) && at >= since24h;
          }).length,
        );
      })
      .catch((err) => {
        console.error("Failed to load audit logs:", err);
        toast.error("Failed to load audit logs.");
        setLogs([]);
        setActiveUsers(0);
      });
  }, []);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayCount = logs.filter((log) => {
    const at = new Date(log.createdAt).getTime();
    return Number.isFinite(at) && at >= startOfToday.getTime();
  }).length;

  const failedLogins = logs.filter((log) => {
    const action = log.action.toLowerCase();
    const details = log.details.toLowerCase();
    return (
      action.includes("failed") ||
      action.includes("login_failed") ||
      action.includes("failed login") ||
      details.includes("failed login")
    );
  }).length;

  const columns = [
    {
      key: "timestamp",
      label: "Timestamp",
      sortable: true,
      render: (row: AuditLog) => (
        <span className="text-sm font-mono text-gray-900">{row.timestamp}</span>
      ),
    },
    {
      key: "user",
      label: "User",
      sortable: true,
    },
    {
      key: "action",
      label: "Action",
      sortable: true,
      render: (row: AuditLog) => {
        const colors: Record<string, string> = {
          Created: "bg-green-100 text-green-700",
          Updated: "bg-blue-100 text-blue-700",
          Deleted: "bg-red-100 text-red-700",
          Approved: "bg-purple-100 text-purple-700",
          Login: "bg-gray-100 text-gray-700",
          Exported: "bg-yellow-100 text-yellow-700",
        };
        return (
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              colors[row.action] || "bg-gray-100 text-gray-700"
            }`}
          >
            {row.action}
          </span>
        );
      },
    },
    {
      key: "module",
      label: "Module",
      sortable: true,
    },
    {
      key: "details",
      label: "Details",
      sortable: false,
      render: (row: AuditLog) => (
        <span className="text-sm text-gray-700">{row.details}</span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      sortable: true,
      render: (row: AuditLog) => (
        <span className="text-sm font-mono text-gray-600">{row.ipAddress}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Audit & Logs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Track all user activities and system changes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Total Logs</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {logs.length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Today</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{todayCount}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Active Users</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{activeUsers}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Failed Logins</p>
          <p className="text-2xl font-semibold text-red-600 mt-1">{failedLogins}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex flex-wrap gap-4 flex-1">
            <select className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent">
              <option value="">All Actions</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="approved">Approved</option>
              <option value="login">Login</option>
            </select>

            <select className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent">
              <option value="">All Modules</option>
              <option value="projects">Projects</option>
              <option value="expenses">Expenses</option>
              <option value="users">Users</option>
              <option value="settings">Settings</option>
            </select>

            <input
              type="date"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <DataTable
        data={logs}
        columns={columns}
        searchable={true}
        exportable={true}
        pageSize={15}
      />
    </div>
  );
}
