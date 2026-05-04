import { useState, useEffect } from "react";
import { getChartAccounts } from "../../api/finance-extras";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  BookOpen,
  X,
  Save,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";

type AccountType = "Assets" | "Liabilities" | "Equity" | "Income" | "Expenses";

interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentId: string | null;
  description: string;
}

const typeColors: Record<AccountType, string> = {
  Assets: "bg-blue-100 text-blue-700",
  Liabilities: "bg-red-100 text-red-700",
  Equity: "bg-purple-100 text-purple-700",
  Income: "bg-emerald-100 text-emerald-700",
  Expenses: "bg-orange-100 text-orange-700",
};

const ACCOUNT_TYPES: AccountType[] = [
  "Assets",
  "Liabilities",
  "Equity",
  "Income",
  "Expenses",
];
const ALL_TYPES: Array<AccountType | "All"> = ["All", ...ACCOUNT_TYPES];

const emptyForm = {
  code: "",
  name: "",
  type: "Assets" as AccountType,
  parentId: "" as string | null,
  description: "",
};

export function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    getChartAccounts()
      .then((data) =>
        setAccounts(
          data.map((a) => ({
            id: a.id,
            code: a.code,
            name: a.name,
            type: a.type as AccountType,
            parentId: a.parentId ?? null,
            description: a.description ?? "",
          })),
        ),
      )
      .catch(console.error);
  }, []);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "All">("All");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = accounts.filter((a) => {
    if (typeFilter !== "All" && a.type !== typeFilter) return false;
    if (
      search &&
      !a.name.toLowerCase().includes(search.toLowerCase()) &&
      !a.code.includes(search)
    )
      return false;
    return true;
  });

  function openCreate() {
    setForm(emptyForm);
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(a: Account) {
    setForm({
      code: a.code,
      name: a.name,
      type: a.type,
      parentId: a.parentId ?? "",
      description: a.description,
    });
    setEditId(a.id);
    setShowModal(true);
  }

  function saveAccount() {
    if (!form.code.trim() || !form.name.trim()) return;
    if (editId) {
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === editId
            ? { ...a, ...form, parentId: form.parentId || null }
            : a,
        ),
      );
    } else {
      const newAcc: Account = {
        id: `a${Date.now()}`,
        ...form,
        parentId: form.parentId || null,
      };
      setAccounts((prev) => [...prev, newAcc]);
    }
    setShowModal(false);
  }

  function confirmDelete() {
    if (!deleteId) return;
    setAccounts((prev) =>
      prev.filter((a) => a.id !== deleteId && a.parentId !== deleteId),
    );
    setDeleteId(null);
  }

  function getDepth(id: string): number {
    const a = accounts.find((x) => x.id === id);
    if (!a || !a.parentId) return 0;
    return 1 + getDepth(a.parentId);
  }

  const topLevelAccounts = accounts.filter((a) => a.parentId === null);
  const countByType = (t: AccountType) =>
    accounts.filter((a) => a.type === t).length;

  function handleExport() {
    exportCSV(
      "chart-of-accounts",
      ["Code", "Name", "Type", "Description"],
      accounts.map((a) => [a.code, a.name, a.type, a.description]),
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Chart of Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Define and manage all financial accounts used in the system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Account
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-5 gap-3">
        {ACCOUNT_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(typeFilter === t ? "All" : t)}
            className={`p-3 rounded-xl border text-left transition-all ${typeFilter === t ? "border-emerald-300 bg-emerald-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <p className="text-xs text-gray-500 font-medium">{t}</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">
              {countByType(t)}
            </p>
            <span
              className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium mt-1 ${typeColors[t]}`}
            >
              {t}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {ALL_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${typeFilter === t ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Accounts table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Account Structure
          </span>
          <span className="text-xs text-gray-400">
            {filtered.length} accounts
          </span>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Code
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Account Name
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Type
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Description
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((a) => {
              const depth = getDepth(a.id);
              return (
                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {a.code}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div
                      className="flex items-center"
                      style={{ paddingLeft: `${depth * 16}px` }}
                    >
                      {depth > 0 && (
                        <ChevronRight className="w-3 h-3 text-gray-300 mr-1 shrink-0" />
                      )}
                      <span
                        className={`text-sm text-gray-900 ${depth === 0 ? "font-semibold" : ""}`}
                      >
                        {a.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeColors[a.type]}`}
                    >
                      {a.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {a.description}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(a)}
                        className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(a.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-12 text-center text-sm text-gray-400"
                >
                  No accounts found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-900">
                  {editId ? "Edit Account" : "New Account"}
                </h2>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Account Code *
                  </label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    placeholder="e.g. 1100"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Account Type *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as AccountType })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ACCOUNT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Account Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Cash & Bank"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Parent Account
                </label>
                <select
                  value={form.parentId ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, parentId: e.target.value || null })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">None (Top-level)</option>
                  {accounts
                    .filter((a) => a.id !== editId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.code} – {a.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Brief description of this account"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveAccount}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Save className="w-3.5 h-3.5" />
                {editId ? "Save Changes" : "Create Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Delete Account?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              This will also delete all child accounts under it. This action
              cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
