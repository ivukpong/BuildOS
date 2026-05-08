import { useState, useEffect } from "react";
import { fetchBudgetBreakdown, fetchBudgets } from "../../api/budgets";
import {
  Plus,
  Search,
  Download,
  Target,
  AlertTriangle,
  CheckCircle,
  X,
  Save,
  ChevronRight,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";

type BudgetScope = "Project" | "Department";
type BudgetStatus =
  | "Active"
  | "On Track"
  | "At Risk"
  | "Over Budget"
  | "Closed";

interface BudgetLine {
  id: string;
  name: string;
  scope: BudgetScope;
  totalBudget: number;
  spent: number;
  committed: number;
  period: string;
  status: BudgetStatus;
}

const statusConfig: Record<BudgetStatus, { badge: string; dot: string }> = {
  Active: { badge: "bg-blue-100 text-blue-700", dot: "bg-blue-400" },
  "On Track": {
    badge: "bg-emerald-100 text-emerald-700",
    dot: "bg-emerald-500",
  },
  "At Risk": { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  "Over Budget": { badge: "bg-red-100 text-red-700", dot: "bg-red-500" },
  Closed: { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

const emptyForm = {
  name: "",
  scope: "Project" as BudgetScope,
  totalBudget: "",
  period: "FY2026",
};

export function BudgetManagementPage() {
  const [budgets, setBudgets] = useState<BudgetLine[]>([]);
  useEffect(() => {
    fetchBudgets().then(setBudgets);
  }, []);
  const [search, setSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<BudgetScope | "All">("All");
  const [selectedBudget, setSelectedBudget] = useState<BudgetLine | null>(null);
  const [budgetBreakdown, setBudgetBreakdown] = useState<
    { category: string; budgeted: number; actual: number }[]
  >([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchBudgetBreakdown().then(setBudgetBreakdown).catch(() => setBudgetBreakdown([]));
  }, []);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);
  const pct = (spent: number, total: number) =>
    total > 0 ? Math.round((spent / total) * 100) : 0;

  const filtered = budgets.filter((b) => {
    if (scopeFilter !== "All" && b.scope !== scopeFilter) return false;
    if (
      search &&
      !b.name.toLowerCase().includes(search.toLowerCase()) &&
      !b.id.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  function addBudget() {
    if (!form.name || !form.totalBudget) return;
    const newB: BudgetLine = {
      id: `BUD-${String(budgets.length + 1).padStart(3, "0")}`,
      name: form.name,
      scope: form.scope,
      totalBudget: parseFloat(form.totalBudget.replace(/,/g, "")),
      spent: 0,
      committed: 0,
      period: form.period,
      status: "Active",
    };
    setBudgets([...budgets, newB]);
    setShowAddModal(false);
    setForm(emptyForm);
  }

  function handleExport() {
    exportCSV(
      "budgets",
      [
        "ID",
        "Name",
        "Scope",
        "Budget",
        "Spent",
        "Committed",
        "Remaining",
        "Period",
        "Status",
      ],
      budgets.map((b) => [
        b.id,
        b.name,
        b.scope,
        fmt(b.totalBudget),
        fmt(b.spent),
        fmt(b.committed),
        fmt(b.totalBudget - b.spent - b.committed),
        b.period,
        b.status,
      ]),
    );
  }

  const totalBudget = budgets.reduce((s, b) => s + b.totalBudget, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter((b) => b.status === "Over Budget").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Budget Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define and track budgets by project or department
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> New Budget
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Budgeted</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {fmt(totalBudget)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Spent</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {fmt(totalSpent)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {pct(totalSpent, totalBudget)}% of total budget
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Remaining</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {fmt(totalBudget - totalSpent)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Over Budget</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{overBudget}</p>
          <p className="text-xs text-gray-400 mt-0.5">Budgets exceeded</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Budget list */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search budgets..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              {(["All", "Project", "Department"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setScopeFilter(s)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${scopeFilter === s ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Budget
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Utilisation
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                    Status
                  </th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b) => {
                  const p = pct(b.spent, b.totalBudget);
                  const isSelected = selectedBudget?.id === b.id;
                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-gray-50 cursor-pointer transition-colors ${isSelected ? "bg-emerald-50" : ""}`}
                      onClick={() => setSelectedBudget(b)}
                    >
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900">
                          {b.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {b.scope} · {b.period}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                        {fmt(b.totalBudget)}
                      </td>
                      <td className="px-5 py-3 min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${p > 100 ? "bg-red-500" : p >= 85 ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ width: `${Math.min(p, 100)}%` }}
                            />
                          </div>
                          <span
                            className={`text-xs font-semibold ${p > 100 ? "text-red-600" : p >= 85 ? "text-amber-600" : "text-gray-600"}`}
                          >
                            {p}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig[b.status].badge}`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <ChevronRight
                          className={`w-4 h-4 ml-auto transition-colors ${isSelected ? "text-emerald-600" : "text-gray-300"}`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel */}
        <div className="col-span-1">
          {selectedBudget ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 sticky top-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {selectedBudget.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedBudget.scope} · {selectedBudget.period}
                  </p>
                </div>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig[selectedBudget.status].badge}`}
                >
                  {selectedBudget.status}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Budget</span>
                  <span className="font-semibold text-gray-900">
                    {fmt(selectedBudget.totalBudget)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Spent</span>
                  <span className="font-semibold text-red-600">
                    {fmt(selectedBudget.spent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Committed</span>
                  <span className="font-semibold text-amber-600">
                    {fmt(selectedBudget.committed)}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                  <span className="text-gray-500">Available</span>
                  <span className="font-semibold text-emerald-600">
                    {fmt(
                      Math.max(
                        0,
                        selectedBudget.totalBudget -
                          selectedBudget.spent -
                          selectedBudget.committed,
                      ),
                    )}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Budget utilisation</span>
                  <span className="font-semibold">
                    {pct(selectedBudget.spent, selectedBudget.totalBudget)}%
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${pct(selectedBudget.spent, selectedBudget.totalBudget) > 100 ? "bg-red-500" : pct(selectedBudget.spent, selectedBudget.totalBudget) >= 85 ? "bg-amber-500" : "bg-emerald-500"}`}
                    style={{
                      width: `${Math.min(pct(selectedBudget.spent, selectedBudget.totalBudget), 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-gray-700 mb-3">
                  Budget Breakdown
                </p>
                <div className="space-y-2">
                  {budgetBreakdown.map((item) => (
                    <div key={item.category}>
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="text-gray-600">{item.category}</span>
                        <span
                          className={`font-medium ${item.actual > item.budgeted ? "text-red-600" : "text-gray-700"}`}
                        >
                          {fmt(item.actual)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1">
                        <div
                          className={`h-1 rounded-full ${item.actual > item.budgeted ? "bg-red-400" : "bg-emerald-400"}`}
                          style={{
                            width: `${Math.min(pct(item.actual, item.budgeted), 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBudget.status === "Over Budget" && (
                <div className="flex items-start gap-2 bg-red-50 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">
                    This budget has been exceeded. A budget override approval is
                    required to continue spending.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
              <Target className="w-8 h-8 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                Select a budget to view details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                New Budget
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Project Alpha"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Scope *
                  </label>
                  <select
                    value={form.scope}
                    onChange={(e) =>
                      setForm({ ...form, scope: e.target.value as BudgetScope })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Project">Project</option>
                    <option value="Department">Department</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Period
                  </label>
                  <input
                    value={form.period}
                    onChange={(e) =>
                      setForm({ ...form, period: e.target.value })
                    }
                    placeholder="e.g. FY2026"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Total Budget (USD) *
                </label>
                <input
                  value={form.totalBudget}
                  onChange={(e) =>
                    setForm({ ...form, totalBudget: e.target.value })
                  }
                  placeholder="e.g. 5000000"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addBudget}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Save className="w-3.5 h-3.5" /> Create Budget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
