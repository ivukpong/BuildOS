import { useEffect, useState } from "react";
import { getProcessMappings, saveProcessMappings } from "../../api/finance-extras";
import { formatDateByGeneralSettings } from "../../utils/generalSettings";
import {
  GitBranch,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
type MappingStatus = "mapped" | "unmapped";

interface AccountMappingLine {
  id: string;
  account: string; // display name e.g. "Material Costs"
  glCode: string; // auto-populated from COA e.g. "5200"
  action: "debit" | "credit";
  field: string; // source field reference
}

interface ProcessMapping {
  id: string;
  application: string;
  process: string;
  lines: AccountMappingLine[];
  status: MappingStatus;
  lastUpdated: string;
  updatedBy: string;
}

// ── Chart of Accounts ─────────────────────────────────────────────────────────
const COA: readonly { code: string; name: string }[] = [
  { code: "1100", name: "Accounts Receivable" },
  { code: "1110", name: "Cash & Bank" },
  { code: "1200", name: "Staff Advances" },
  { code: "1210", name: "Plant & Equipment" },
  { code: "1300", name: "Inventory" },
  { code: "2000", name: "Accounts Payable" },
  { code: "2100", name: "Accrued Liabilities" },
  { code: "2300", name: "Tax Payable – VAT" },
  { code: "2310", name: "Tax Payable – WHT" },
  { code: "2320", name: "PAYE Liability" },
  { code: "4100", name: "Contract Revenue" },
  { code: "4200", name: "Service Income" },
  { code: "5100", name: "Labour Costs" },
  { code: "5200", name: "Material Costs" },
  { code: "5300", name: "Equipment Costs" },
  { code: "5400", name: "Overhead" },
] as const;

/** GL code lookup: account name → numeric code */
const COA_MAP: Record<string, string> = Object.fromEntries(
  COA.map((a) => [a.name, a.code]),
);

// ── Source Fields ─────────────────────────────────────────────────────────────
const SOURCE_FIELDS = [
  "Amount",
  "Net Amount",
  "Gross Amount",
  "Purchase Value",
  "Order Amount",
  "Total Payable",
  "Payment Amount",
  "Net Payment",
  "Goods Value",
  "Transfer Cost",
  "Adjustment Value",
  "Gross Salary",
  "Net Pay",
  "PAYE Tax",
  "Allowance Total",
  "Advance Amount",
  "WHT Deducted",
  "Claim Amount",
  "Reimbursement",
  "Travel Amount",
  "Invoice Amount",
  "Labour Cost",
  "Expense Amount",
  "VAT",
  "Tax",
  "Fee",
  "Penalty",
  "Discount",
  "Retention Amount",
  "Milestone Value",
  "Contract Value",
];

const APPLICATIONS = [
  "Procurement",
  "Storefront",
  "HR",
  "ESS",
  "Projects",
  "Finance",
];

const PROCESSES_BY_APP: Record<string, string[]> = {
  Procurement: [
    "Purchase Request",
    "Purchase Order",
    "Supplier Payment",
    "Goods Receipt",
    "Invoice Processing",
    "Supplier Advance",
  ],
  Storefront: [
    "Material Transfer",
    "Stock Adjustment",
    "Material Return",
    "Issue to Site",
    "Goods Received Note",
  ],
  HR: [
    "Payroll",
    "Allowances",
    "Salary Advance",
    "Deductions",
    "Bonus Payment",
    "Pension Remittance",
  ],
  ESS: ["Expense Claim", "Reimbursement", "Travel Advance", "Leave Encashment"],
  Projects: [
    "Project Expense",
    "Resource Allocation",
    "Contract Revenue",
    "Retention",
    "Milestone Billing",
  ],
  Finance: [
    "Bank Reconciliation",
    "Journal Entry",
    "Asset Depreciation",
    "Tax Filing",
    "WHT Deduction",
  ],
};

const APP_COLORS: Record<string, string> = {
  Procurement: "bg-blue-100 text-blue-700",
  Storefront: "bg-teal-100 text-teal-700",
  HR: "bg-purple-100 text-purple-700",
  ESS: "bg-orange-100 text-orange-700",
  Projects: "bg-indigo-100 text-indigo-700",
  Finance: "bg-emerald-100 text-emerald-700",
};

/** Build a mapping line with auto-populated glCode from COA_MAP */
function ln(
  id: string,
  account: string,
  action: "debit" | "credit",
  field: string,
): AccountMappingLine {
  return { id, account, glCode: COA_MAP[account] ?? "", action, field };
}

// ── Account Mapping Modal ──────────────────────────────────────────────────────
function MappingModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: ProcessMapping;
  onClose: () => void;
  onSave: (m: ProcessMapping) => void;
}) {
  const today = formatDateByGeneralSettings(new Date());
  const [application, setApplication] = useState(
    initial?.application ?? APPLICATIONS[0],
  );
  const [process, setProcess] = useState(initial?.process ?? "");
  const [lines, setLines] = useState<AccountMappingLine[]>(
    initial?.lines?.length
      ? initial.lines
      : [
          ln(`nl-${Date.now()}-0`, COA[0].name, "debit", SOURCE_FIELDS[0]),
          ln(`nl-${Date.now()}-1`, COA[1].name, "credit", SOURCE_FIELDS[0]),
        ],
  );

  const availableProcesses = PROCESSES_BY_APP[application] ?? [];

  const updateApplication = (app: string) => {
    setApplication(app);
    setProcess("");
  };

  const updateAccount = (idx: number, accountName: string) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? { ...l, account: accountName, glCode: COA_MAP[accountName] ?? "" }
          : l,
      ),
    );
  };

  const updateLine = <K extends keyof AccountMappingLine>(
    idx: number,
    key: K,
    val: AccountMappingLine[K],
  ) => {
    setLines((p) => p.map((l, i) => (i === idx ? { ...l, [key]: val } : l)));
  };

  const addLine = () => {
    setLines((p) => [
      ...p,
      ln(`nl-${Date.now()}`, COA[0].name, "debit", SOURCE_FIELDS[0]),
    ]);
  };

  const removeLine = (idx: number) => {
    setLines((p) => p.filter((_, i) => i !== idx));
  };

  const valid =
    application &&
    process.trim() &&
    lines.length > 0 &&
    lines.every((l) => l.account && l.field);

  function save() {
    if (!valid) return;
    onSave({
      id: initial?.id ?? `pm-${Date.now()}`,
      application,
      process: process.trim(),
      lines,
      status: "mapped",
      lastUpdated: today,
      updatedBy: "Sola Adeleke",
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {initial ? "Edit Account Mapping" : "New Account Mapping"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {/* Application + Process */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Application <span className="text-red-500">*</span>
              </label>
              <select
                value={application}
                onChange={(e) => updateApplication(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {APPLICATIONS.map((a) => (
                  <option key={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Process <span className="text-red-500">*</span>
              </label>
              <select
                value={process}
                onChange={(e) => setProcess(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select process…</option>
                {availableProcesses.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Mapping lines */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Account Mapping Lines
              </p>
              <button
                onClick={addLine}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> Add Line
              </button>
            </div>

            <div className="space-y-2">
              {/* Column headers */}
              <div className="grid grid-cols-[2fr_72px_112px_1.3fr_32px] gap-2 px-1">
                <span className="text-xs text-gray-400 font-medium">
                  Account
                </span>
                <span className="text-xs text-gray-400 font-medium text-center">
                  GL Code
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  Action
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  Field (Source)
                </span>
                <span />
              </div>

              {lines.map((line, idx) => (
                <div
                  key={line.id}
                  className="grid grid-cols-[2fr_72px_112px_1.3fr_32px] gap-2 items-center"
                >
                  {/* Account dropdown */}
                  <select
                    value={line.account}
                    onChange={(e) => updateAccount(idx, e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {COA.map((a) => (
                      <option key={a.code} value={a.name}>
                        {a.code} · {a.name}
                      </option>
                    ))}
                  </select>

                  {/* GL Code — read-only, auto-filled */}
                  <input
                    value={line.glCode}
                    readOnly
                    tabIndex={-1}
                    className="border border-gray-100 bg-gray-50 rounded-lg px-2 py-2 text-sm text-center font-mono text-gray-500 cursor-default select-none focus:outline-none"
                  />

                  {/* Action */}
                  <select
                    value={line.action}
                    onChange={(e) =>
                      updateLine(
                        idx,
                        "action",
                        e.target.value as "debit" | "credit",
                      )
                    }
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="debit">Debit</option>
                    <option value="credit">Credit</option>
                  </select>

                  {/* Field dropdown */}
                  <select
                    value={line.field}
                    onChange={(e) => updateLine(idx, "field", e.target.value)}
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {SOURCE_FIELDS.map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>

                  {/* Remove */}
                  <button
                    onClick={() => removeLine(idx)}
                    disabled={lines.length <= 1}
                    className="p-1.5 text-gray-300 hover:text-red-500 disabled:opacity-30 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {lines.length === 0 && (
              <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> At least one mapping
                line is required.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 rounded-b-2xl bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={!valid}
            className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {initial ? "Save Changes" : "Create Mapping"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function ProcessMappingPage() {
  const [mappings, setMappings] = useState<ProcessMapping[]>([]);
  const [search, setSearch] = useState("");
  const [appFilter, setAppFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<MappingStatus | "All">(
    "All",
  );
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<ProcessMapping | undefined>();

  useEffect(() => {
    getProcessMappings()
      .then((d) => setMappings(d as ProcessMapping[]))
      .catch(() => {});
  }, []);

  const filtered = mappings.filter((m) => {
    const matchApp = appFilter === "All" || m.application === appFilter;
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    const matchSearch =
      !search ||
      m.process.toLowerCase().includes(search.toLowerCase()) ||
      m.application.toLowerCase().includes(search.toLowerCase());
    return matchApp && matchStatus && matchSearch;
  });

  const unmappedCount = mappings.filter((m) => m.status === "unmapped").length;

  function openEdit(m: ProcessMapping) {
    setEditItem(m);
    setShowModal(true);
  }
  function openCreate() {
    setEditItem(undefined);
    setShowModal(true);
  }

  function save(m: ProcessMapping) {
    const exists = mappings.find((x) => x.id === m.id);
    const next = exists
      ? mappings.map((x) => (x.id === m.id ? m : x))
      : [m, ...mappings];
    setMappings(next);
    saveProcessMappings(next).catch(() => {});
  }

  function remove(id: string) {
    const next = mappings.map((m) =>
      m.id === id ? { ...m, status: "unmapped" as const, lines: [] } : m,
    );
    setMappings(next);
    saveProcessMappings(next).catch(() => {});
  }

  // Flatten to rows for table
  type FlatRow = {
    mapping: ProcessMapping;
    line: AccountMappingLine | null;
    lineIdx: number;
    isFirst: boolean;
    lineCount: number;
  };
  const flatRows: FlatRow[] = [];
  for (const m of filtered) {
    if (m.lines.length === 0) {
      flatRows.push({
        mapping: m,
        line: null,
        lineIdx: 0,
        isFirst: true,
        lineCount: 0,
      });
    } else {
      m.lines.forEach((line, lineIdx) => {
        flatRows.push({
          mapping: m,
          line,
          lineIdx,
          isFirst: lineIdx === 0,
          lineCount: m.lines.length,
        });
      });
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Account Mapping
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Map every financial process to Chart of Accounts entries
            (debit/credit per field)
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm hover:bg-emerald-700"
        >
          <Plus className="w-3.5 h-3.5" /> New Mapping
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
        <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-emerald-800">
          Each process can have multiple debit and credit lines. All line fields
          are applied when the process fires a financial posting.
        </p>
      </div>

      {/* Unmapped alert */}
      {unmappedCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {unmappedCount} process{unmappedCount > 1 ? "es are" : " is"}{" "}
            unmapped — postings will not be generated automatically.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{mappings.length}</p>
          <p className="text-xs text-gray-500">Total Processes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-600">
            {mappings.filter((m) => m.status === "mapped").length}
          </p>
          <p className="text-xs text-gray-500">Mapped</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-amber-600">{unmappedCount}</p>
          <p className="text-xs text-gray-500">Unmapped</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-blue-600">
            {mappings.length > 0
              ? Math.round(
                  (mappings.filter((m) => m.status === "mapped").length /
                    mappings.length) *
                    100,
                )
              : 0}
            %
          </p>
          <p className="text-xs text-gray-500">Coverage</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search processes…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {["All", ...APPLICATIONS].map((a) => (
            <button
              key={a}
              onClick={() => setAppFilter(a)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                appFilter === a
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(["All", "mapped", "unmapped"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                statusFilter === s
                  ? "bg-emerald-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-400">
          {filtered.length} process{filtered.length !== 1 ? "es" : ""}
        </span>
      </div>

      {/* Flat table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Application
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Process
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Field (Source)
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Action
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                GL Account
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                GL Code
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">
                Status
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {flatRows.map((row, idx) => {
              const { mapping: m, line, isFirst, lineCount } = row;
              const isGroupStart = isFirst;
              const isLastInGroup =
                line !== null ? row.lineIdx === lineCount - 1 : true;

              return (
                <tr
                  key={`${m.id}-${row.lineIdx}`}
                  className={`hover:bg-gray-50/80 transition-colors ${isGroupStart && idx > 0 ? "border-t-2 border-gray-200" : ""}`}
                >
                  {/* Application — only on first row of group */}
                  <td className="px-5 py-2.5 align-top">
                    {isFirst && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${APP_COLORS[m.application] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {m.application}
                      </span>
                    )}
                  </td>

                  {/* Process — only on first row of group */}
                  <td className="px-5 py-2.5 align-top">
                    {isFirst && (
                      <span className="font-medium text-gray-900">
                        {m.process}
                      </span>
                    )}
                  </td>

                  {/* Field / mapping line */}
                  <td className="px-5 py-2.5 text-gray-600">
                    {line ? (
                      line.field
                    ) : (
                      <span className="text-amber-500 text-xs">
                        Not configured
                      </span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-2.5">
                    {line ? (
                      line.action === "debit" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                          <ArrowUpRight className="w-3 h-3" /> Debit
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                          <ArrowDownLeft className="w-3 h-3" /> Credit
                        </span>
                      )
                    ) : null}
                  </td>

                  {/* GL Account name */}
                  <td className="px-5 py-2.5 text-sm text-gray-700">
                    {line ? line.account : null}
                  </td>

                  {/* GL Code */}
                  <td className="px-4 py-2.5">
                    {line && (
                      <span className="font-mono text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                        {line.glCode}
                      </span>
                    )}
                  </td>

                  {/* Status — only on first row */}
                  <td className="px-4 py-2.5 align-top">
                    {isFirst &&
                      (m.status === "mapped" ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle className="w-3 h-3" /> Mapped
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-medium">
                          <AlertTriangle className="w-3 h-3" /> Unmapped
                        </span>
                      ))}
                  </td>

                  {/* Actions — only on first row */}
                  <td className="px-5 py-2.5 align-top">
                    {isFirst && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(m)}
                          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {m.status === "mapped" && (
                          <button
                            onClick={() => remove(m.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
              void isLastInGroup;
            })}
            {flatRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-gray-400"
                >
                  <GitBranch className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No mappings found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <MappingModal
          initial={editItem}
          onClose={() => setShowModal(false)}
          onSave={save}
        />
      )}
    </div>
  );
}
