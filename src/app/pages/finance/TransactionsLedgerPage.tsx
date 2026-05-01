import { useState, useEffect } from "react";
import {
  Search,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";
import { getTransactions } from "../../api/finance-extras";

// ── Types ─────────────────────────────────────────────────────────────────────
type TxnType =
  | "Income"
  | "Expense"
  | "Payroll"
  | "Payment"
  | "Transfer"
  | "Adjustment"
  | "Journal";
type ApprovalStatus = "approved" | "pending" | "auto-approved";

interface LinkedRecord {
  label: string;
  ref: string;
}

interface Transaction {
  id: string;
  type: TxnType;
  description: string;
  debitAccount: string;
  creditAccount: string;
  reference: string;
  amount: number;
  date: string;
  createdBy: string;
  sourceApp: string;
  sourceProcess: string;
  approvalStatus: ApprovalStatus;
  linkedRecords?: LinkedRecord[];
  notes?: string;
}

// ── Style helpers ─────────────────────────────────────────────────────────────
const typeColors: Record<TxnType, string> = {
  Income: "bg-emerald-100 text-emerald-700",
  Expense: "bg-red-100 text-red-700",
  Payroll: "bg-purple-100 text-purple-700",
  Payment: "bg-blue-100 text-blue-700",
  Transfer: "bg-gray-100 text-gray-700",
  Adjustment: "bg-amber-100 text-amber-700",
  Journal: "bg-indigo-100 text-indigo-700",
};

const approvalBadge: Record<
  ApprovalStatus,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  approved: {
    label: "Approved",
    cls: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  pending: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-700",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  "auto-approved": {
    label: "Auto-Approved",
    cls: "bg-gray-100 text-gray-600",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
};

const APP_COLORS: Record<string, string> = {
  Procurement: "bg-blue-50 text-blue-700",
  Storefront: "bg-teal-50 text-teal-700",
  HR: "bg-purple-50 text-purple-700",
  ESS: "bg-orange-50 text-orange-700",
  Projects: "bg-indigo-50 text-indigo-700",
  Finance: "bg-emerald-50 text-emerald-700",
};

const TYPE_OPTS: Array<TxnType | "All"> = [
  "All",
  "Income",
  "Expense",
  "Payroll",
  "Payment",
  "Transfer",
  "Adjustment",
  "Journal",
];

function fmtAmt(n: number) {
  const abs = `₦${Math.abs(n).toLocaleString()}`;
  return n >= 0 ? `+${abs}` : `−${abs}`;
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function TransactionDetailModal({
  txn,
  onClose,
}: {
  txn: Transaction;
  onClose: () => void;
}) {
  const ab = approvalBadge[txn.approvalStatus];
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-gray-900">
              {txn.id}
            </span>
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeColors[txn.type]}`}
            >
              {txn.type}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-5">
          {/* Basic Info */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Basic Information
            </p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Description</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {txn.description}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transaction ID</p>
                <p className="font-mono font-medium text-gray-900 mt-0.5">
                  {txn.id}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Date</p>
                <p className="font-medium text-gray-900 mt-0.5">{txn.date}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Reference</p>
                <p className="font-mono font-medium text-gray-900 mt-0.5">
                  {txn.reference}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Amount</p>
                <p
                  className={`text-lg font-bold mt-0.5 ${txn.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {fmtAmt(txn.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Initiated By</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {txn.createdBy}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Approval Status</p>
                <span
                  className={`inline-flex items-center gap-1.5 mt-0.5 px-2 py-0.5 text-xs rounded-full font-medium ${ab.cls}`}
                >
                  {ab.icon}
                  {ab.label}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Source Application</p>
                <span
                  className={`inline-block mt-0.5 px-2 py-0.5 text-xs rounded font-medium ${APP_COLORS[txn.sourceApp] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {txn.sourceApp}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Source Process</p>
                <p className="font-medium text-gray-900 mt-0.5">
                  {txn.sourceProcess}
                </p>
              </div>
              {txn.notes && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700 mt-0.5 bg-gray-50 rounded-lg px-3 py-2">
                    {txn.notes}
                  </p>
                </div>
              )}
            </div>
          </section>
          <hr className="border-gray-100" />
          {/* Financial Entries */}
          <section>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Financial Entries
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">
                      Entry
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">
                      Account
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
                        DR
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">
                      {txn.debitAccount}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                      ₦{Math.abs(txn.amount).toLocaleString()}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded font-medium">
                        CR
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-700">
                      {txn.creditAccount}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                      ₦{Math.abs(txn.amount).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          {/* Linked Records */}
          {txn.linkedRecords && txn.linkedRecords.length > 0 && (
            <>
              <hr className="border-gray-100" />
              <section>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Linked Records
                </p>
                <div className="flex flex-wrap gap-2">
                  {txn.linkedRecords.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-blue-50 border border-blue-100 rounded-lg"
                    >
                      <span className="text-xs text-gray-500">{r.label}:</span>
                      <span className="text-xs font-mono font-semibold text-blue-700">
                        {r.ref}
                      </span>
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function TransactionsLedgerPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TxnType | "All">("All");
  const [sortField, setSortField] = useState<"amount" | "date">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    getTransactions()
      .then((data) =>
        setAllTransactions(
          data.map((t) => ({
            id: t.id,
            type: t.type as TxnType,
            description: t.description,
            debitAccount: "",
            creditAccount: "",
            reference: t.reference ?? "",
            amount: t.type === "Income" ? t.amount : -t.amount,
            date: t.date,
            createdBy: t.createdBy ?? "",
            sourceApp: "",
            sourceProcess: "",
            approvalStatus: (t.status as ApprovalStatus) ?? "pending",
            notes: t.notes,
          })),
        ),
      )
      .catch(console.error);
  }, []);

  const filtered = allTransactions
    .filter((t) => {
      if (typeFilter !== "All" && t.type !== typeFilter) return false;
      if (
        search &&
        ![
          t.id,
          t.description,
          t.debitAccount,
          t.creditAccount,
          t.reference,
          t.sourceApp,
          t.sourceProcess,
        ].some((f) => f.toLowerCase().includes(search.toLowerCase()))
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      if (sortField === "amount")
        return sortDir === "desc"
          ? Math.abs(b.amount) - Math.abs(a.amount)
          : Math.abs(a.amount) - Math.abs(b.amount);
      return sortDir === "desc"
        ? b.date.localeCompare(a.date)
        : a.date.localeCompare(b.date);
    });

  function toggleSort(field: "amount" | "date") {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  const SortIcon = ({ field }: { field: "amount" | "date" }) =>
    sortField === field ? (
      sortDir === "asc" ? (
        <ChevronUp className="w-3 h-3" />
      ) : (
        <ChevronDown className="w-3 h-3" />
      )
    ) : (
      <ChevronDown className="w-3 h-3 opacity-30" />
    );

  const totalInflow = allTransactions
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0);
  const totalOutflow = allTransactions
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const net = totalInflow - totalOutflow;

  function handleExport() {
    exportCSV(
      "transactions-ledger",
      [
        "Transaction ID",
        "Type",
        "Description",
        "Debit Account",
        "Credit Account",
        "Reference",
        "Amount",
        "Date",
        "Source App",
        "Source Process",
        "Approval Status",
        "Created By",
      ],
      filtered.map((t) => [
        t.id,
        t.type,
        t.description,
        t.debitAccount,
        t.creditAccount,
        t.reference,
        fmtAmt(t.amount),
        t.date,
        t.sourceApp,
        t.sourceProcess,
        t.approvalStatus,
        t.createdBy,
      ]),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Transactions Ledger
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Complete financial audit trail — click any row to view full
            transaction details
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Download className="w-4 h-4" /> Export Ledger
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium">Total Inflow</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            ₦{totalInflow.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium">Total Outflow</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            ₦{totalOutflow.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs text-gray-500 font-medium">Net Position</p>
          <p
            className={`text-2xl font-bold mt-1 ${net >= 0 ? "text-emerald-600" : "text-red-600"}`}
          >
            {net >= 0 ? "+" : "−"}₦{Math.abs(net).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search: ID, description, account…"
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {TYPE_OPTS.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                typeFilter === t
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-xs text-gray-400">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Ledger Entries
          </span>
          <span className="text-xs text-gray-400">
            {filtered.length} records · click a row to view details
          </span>
        </div>
        <table className="w-full">
          <thead className="border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Transaction ID
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Type
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Description
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                DR / CR Accounts
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Source
              </th>
              <th
                className="text-left px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none"
                onClick={() => toggleSort("amount")}
              >
                <span className="flex items-center gap-1">
                  Amount <SortIcon field="amount" />
                </span>
              </th>
              <th
                className="text-left px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none"
                onClick={() => toggleSort("date")}
              >
                <span className="flex items-center gap-1">
                  Date <SortIcon field="date" />
                </span>
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Approval
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((t) => {
              const ab = approvalBadge[t.approvalStatus];
              return (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className="hover:bg-emerald-50/40 cursor-pointer transition-colors group"
                >
                  <td className="px-5 py-3 text-xs font-mono text-gray-500 group-hover:text-emerald-700">
                    {t.id}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full font-medium ${typeColors[t.type]}`}
                    >
                      {t.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-900 max-w-[160px] truncate">
                    {t.description}
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-mono text-gray-500 truncate max-w-[130px]">
                      {t.debitAccount}
                    </p>
                    <p className="text-xs font-mono text-gray-400 truncate max-w-[130px]">
                      {t.creditAccount}
                    </p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded font-medium ${APP_COLORS[t.sourceApp] ?? "bg-gray-100 text-gray-600"}`}
                    >
                      {t.sourceApp}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.sourceProcess}
                    </p>
                  </td>
                  <td
                    className={`px-5 py-3 text-sm font-semibold ${t.amount >= 0 ? "text-emerald-600" : "text-red-600"}`}
                  >
                    {fmtAmt(t.amount)}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500 whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`flex items-center gap-1 w-fit text-xs rounded-full px-2 py-0.5 font-medium ${ab.cls}`}
                    >
                      {ab.icon}
                      {ab.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-gray-400"
                >
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <TransactionDetailModal
          txn={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
