import { useState, useEffect } from "react";
import { Users, Shield, Settings, Activity, ArrowUpRight, Info } from "lucide-react";
import { NavLink } from "react-router";
import { getUsers } from "../../api/admin-extras";
import { getAppRoles } from "../../api/admin-extras";

export function AdminDashboardPage() {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [roleCount, setRoleCount] = useState<number | null>(null);

  useEffect(() => {
    getUsers().then((users) => setUserCount(users.length)).catch(() => setUserCount(0));
    getAppRoles().then((roles) => setRoleCount(roles.length)).catch(() => setRoleCount(0));
  }, []);

  const fmt = (n: number | null) => (n === null ? "…" : String(n));

  const metrics = [
    {
      label: "Total Users",
      value: fmt(userCount),
      delta: userCount !== null ? `${userCount} registered` : null,
      deltaPositive: true,
      icon: Users,
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      label: "Active Roles",
      value: fmt(roleCount),
      delta: roleCount !== null ? "Configured roles" : null,
      deltaPositive: null,
      icon: Shield,
      iconBg: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      label: "Active Sessions",
      value: "—",
      delta: "No session endpoint",
      deltaPositive: null,
      icon: Activity,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "System Health",
      value: "—",
      delta: "No health endpoint",
      deltaPositive: null,
      icon: Settings,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">System management and configuration</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 font-medium">{m.label}</p>
              <div className={`w-8 h-8 rounded-lg ${m.iconBg} flex items-center justify-center`}>
                <m.icon className={`w-4 h-4 ${m.iconColor}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{m.value}</p>
            {m.delta && (
              <p className={`text-xs font-medium flex items-center gap-1 ${m.deltaPositive === true ? "text-emerald-600" : m.deltaPositive === false ? "text-red-500" : "text-gray-400"}`}>
                {m.deltaPositive === true && <ArrowUpRight className="w-3 h-3" />}
                {m.delta}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">User Activity</h2>
          {userCount === null ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : userCount === 0 ? (
            <p className="text-sm text-gray-400">No users found.</p>
          ) : (
            <div className="space-y-4">
              {[
                { label: "Registered Users", value: userCount, max: userCount },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-indigo-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${Math.min((item.value / (item.max || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 mt-2">Session analytics not yet available.</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Activity className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No activity log endpoint available.</p>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">System Status</h2>
        <p className="text-sm text-gray-400">No system health endpoint available. Configure a health-check API to display service status.</p>
      </div>

      {/* Quick Actions */}
      <div className="bg-linear-to-r from-indigo-50 to-slate-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-500" />
          Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <NavLink
            to="/apps/admin/users"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Users className="w-4 h-4" />
            Manage Users
          </NavLink>
          <NavLink
            to="/apps/admin/roles"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Shield className="w-4 h-4" />
            Manage Roles
          </NavLink>
          <NavLink
            to="/apps/admin/audit-logs"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Activity className="w-4 h-4" />
            View Audit Log
          </NavLink>
          <NavLink
            to="/apps/admin/general-settings"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            <Settings className="w-4 h-4" />
            Settings
          </NavLink>
        </div>
      </div>
    </div>
  );
}
