import { useState, useEffect } from "react";
import {
  getPayrollEntries,
  getPayrollRuns,
  PayrollRun as ApiPayrollRun,
} from "../../api/hr-extras";
import {
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Eye,
  X,
  Users,
  AlertCircle,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";

type PayrollStatus = "Draft" | "Sent for Approval" | "Approved" | "Paid";

interface PayrollRun {
  id: string;
  period: string;
  department: string;
  headcount: number;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: PayrollStatus;
  submittedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  paidAt?: string;
}

interface PayrollEmployee {
  name: string;
  department: string;
  grossPay: number;
  allowances: number;
  deductions: number;
  netPay: number;
}

const statusConfig: Record<
  PayrollStatus,
  { badge: string; icon: React.ReactNode }
> = {
  Draft: {
    badge: "bg-gray-100 text-gray-600",
    icon: <Clock className="w-3 h-3" />,
  },
  "Sent for Approval": {
    badge: "bg-blue-100 text-blue-700",
    icon: <Send className="w-3 h-3" />,
  },
  Approved: {
    badge: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  Paid: {
    badge: "bg-teal-100 text-teal-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

const STATUS_FLOW: PayrollStatus[] = [
  "Draft",
  "Sent for Approval",
  "Approved",
  "Paid",
];

export function PayrollIntegrationPage() {
  const [payrolls, setPayrolls] = useState<PayrollRun[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | "All">(
    "All",
  );
  const [activeRun, setActiveRun] = useState<PayrollRun | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);

  useEffect(() => {
    getPayrollRuns()
      .then((data: ApiPayrollRun[]) => {
        const mapped: PayrollRun[] = data.map((r) => ({
          id: r.id,
          period: r.periodName,
          department: "All Departments",
          headcount: r.employeeCount,
          grossPay: r.totalGross,
          deductions: r.totalGross - r.totalNet,
          netPay: r.totalNet,
          status: (["Draft", "Sent for Approval", "Approved", "Paid"].includes(
            r.status,
          )
            ? r.status
            : "Draft") as PayrollStatus,
          submittedBy: r.processedBy ?? undefined,
        }));
        setPayrolls(mapped);
        if (mapped.length > 0) setActiveRun(mapped[0]);
      })
      .catch(console.error);
  }, []);


  useEffect(() => {
    if (!activeRun) {
      setEmployees([]);
      return;
    }
    getPayrollEntries(activeRun.id)
      .then((entries) =>
        setEmployees(
          entries.map((e) => ({
            name: e.employeeName,
            department: e.department ?? "",
            grossPay: e.grossPay,
            allowances: e.allowances,
            deductions: e.deductions,
            netPay: e.netPay,
          })),
        ),
      )
      .catch(() => setEmployees([]));
  }, [activeRun?.id]);

  const fmt = (n: number) => `₦${n.toLocaleString()}`;

  const filtered = payrolls.filter((p) => {
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    if (
      search &&
      !p.id.toLowerCase().includes(search.toLowerCase()) &&
      !p.period.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function advance(id: string) {
    setPayrolls((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const idx = STATUS_FLOW.indexOf(p.status);
        if (idx >= STATUS_FLOW.length - 1) return p;
        const next = STATUS_FLOW[idx + 1];
        return {
          ...p,
          status: next,
          submittedBy:
            next === "Sent for Approval" ? "Current User" : p.submittedBy,
          approvedBy: next === "Approved" ? "Finance Manager" : p.approvedBy,
          approvedAt: next === "Approved" ? "Today" : p.approvedAt,
          paidAt: next === "Paid" ? "Today" : p.paidAt,
        };
      }),
    );
    setActiveRun((prev) => {
      if (prev.id !== id) return prev;
      const idx = STATUS_FLOW.indexOf(prev.status);
      if (idx >= STATUS_FLOW.length - 1) return prev;
      return { ...prev, status: STATUS_FLOW[idx + 1] };
    });
  }

  function handleExport() {
    exportCSV(
      "payroll",
      [
        "ID",
        "Period",
        "Headcount",
        "Gross Pay",
        "Deductions",
        "Net Pay",
        "Status",
      ],
      payrolls.map((p) => [
        p.id,
        p.period,
        String(p.headcount),
        fmt(p.grossPay),
        fmt(p.deductions),
        fmt(p.netPay),
        p.status,
      ]),
    );
  }

  const totalNet = payrolls
    .filter((p) => p.status === "Paid")
    .reduce((s, p) => s + p.netPay, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Payroll Integration
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review, approve and process payroll from HR
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-800">
          Payroll data is received from the <strong>HR module</strong>. Review
          and approve here before initiating payment.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Paid (YTD)</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {fmt(totalNet)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Current Month</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {fmt(activeRun?.netPay ?? 0)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {activeRun?.period ?? "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Headcount</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {activeRun?.headcount ?? "—"}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Pending</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {payrolls.filter((p) => !["Paid"].includes(p.status)).length}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Runs awaiting payment</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Payroll runs */}
        <div className="col-span-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as PayrollStatus | "All")
              }
              className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="All">All</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => setActiveRun(p)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${activeRun?.id === p.id ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {p.period}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig[p.status].badge}`}
                  >
                    {statusConfig[p.status].icon}
                    {p.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {p.headcount} employees · {fmt(p.netPay)} net
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Run detail */}
        <div className="col-span-2 space-y-4">
          {activeRun && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {activeRun.period} Payroll
                  </h3>
                  <p className="text-xs text-gray-500">
                    {activeRun.id} · {activeRun.department}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full font-medium ${statusConfig[activeRun.status].badge}`}
                >
                  {statusConfig[activeRun.status].icon}
                  {activeRun.status}
                </span>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Gross Pay</p>
                  <p className="text-lg font-bold text-gray-900">
                    {fmt(activeRun.grossPay)}
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Deductions</p>
                  <p className="text-lg font-bold text-red-600">
                    −{fmt(activeRun.deductions)}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Net Pay</p>
                  <p className="text-lg font-bold text-emerald-700">
                    {fmt(activeRun.netPay)}
                  </p>
                </div>
              </div>

              {/* Status trail */}
              <div className="space-y-2 border-t border-gray-100 pt-4 mb-4">
                {activeRun.submittedBy && (
                  <p className="text-xs text-gray-500">
                    Submitted by{" "}
                    <span className="font-medium text-gray-700">
                      {activeRun.submittedBy}
                    </span>
                  </p>
                )}
                {activeRun.approvedBy && (
                  <p className="text-xs text-gray-500">
                    Approved by{" "}
                    <span className="font-medium text-gray-700">
                      {activeRun.approvedBy}
                    </span>{" "}
                    on {activeRun.approvedAt}
                  </p>
                )}
                {activeRun.paidAt && (
                  <p className="text-xs text-emerald-600 font-medium">
                    ✓ Payment disbursed on {activeRun.paidAt}
                  </p>
                )}
              </div>

              {/* Action */}
              <div className="flex gap-2">
                {activeRun.status === "Draft" && (
                  <button
                    onClick={() => advance(activeRun.id)}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Submit for Approval
                    </span>
                  </button>
                )}
                {activeRun.status === "Sent for Approval" && (
                  <button
                    onClick={() => advance(activeRun.id)}
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Approve Payroll
                    </span>
                  </button>
                )}
                {activeRun.status === "Approved" && (
                  <button
                    onClick={() => advance(activeRun.id)}
                    className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                  >
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Mark as Paid
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Employee breakdown */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900">
                Employee Pay Breakdown
              </h3>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                    Employee
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                    Basic
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                    Allowances
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                    Deductions
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                    Net
                  </th>
                  <th className="text-left px-5 py-2.5 text-xs font-semibold text-gray-500">
                    Bank
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {employees.map((e) => (
                  <tr key={e.name} className="hover:bg-gray-50">
                    <td className="px-5 py-2.5">
                      <p className="text-sm font-medium text-gray-900">
                        {e.name}
                      </p>
                      <p className="text-xs text-gray-400">{e.department || "—"}</p>
                    </td>
                    <td className="px-5 py-2.5 text-sm text-gray-700">
                      {fmt(e.grossPay - e.allowances)}
                    </td>
                    <td className="px-5 py-2.5 text-sm text-emerald-600">
                      +{fmt(e.allowances)}
                    </td>
                    <td className="px-5 py-2.5 text-sm text-red-600">
                      −{fmt(e.deductions)}
                    </td>
                    <td className="px-5 py-2.5 text-sm font-semibold text-gray-900">
                      {fmt(e.netPay)}
                    </td>
                    <td className="px-5 py-2.5 text-xs text-gray-500">
                      Not available
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
