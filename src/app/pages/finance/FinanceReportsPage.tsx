import { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Eye,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";
import { apiFetch } from "../../api/client";
import {
  formatCurrencyByGeneralSettings,
  formatDateByGeneralSettings,
  formatNumberByGeneralSettings,
  getFiscalQuarterRange,
  getFiscalYearRange,
} from "../../utils/generalSettings";

type ReportType =
  | "Expense Report"
  | "Income Report"
  | "Cash Flow"
  | "Budget vs Actual"
  | "Payroll Summary";

interface ReportTemplate {
  id: string;
  type: ReportType;
  icon: React.ReactNode;
  description: string;
  color: string;
  bg: string;
}

interface ReportRow {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean;
}

interface ApiReportRow {
  label: string;
  amount: number;
  format?: "currency" | "count" | "percent";
  sub?: string;
  positive?: boolean;
}

interface PeriodOption {
  label: string;
  from: string;
  to: string;
}

function monthRange(offset: number): PeriodOption {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return {
    label: start.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    }),
    from: iso(start),
    to: iso(end),
  };
}

// Periods derived from today and the configured fiscal year start.
function buildPeriodOptions(): PeriodOption[] {
  const options = [
    monthRange(0),
    monthRange(-1),
    getFiscalQuarterRange(0),
    getFiscalQuarterRange(-1),
    getFiscalYearRange(),
  ];
  // De-duplicate by label (e.g. quarter matching the fiscal year in edge configs).
  return options.filter(
    (opt, i) => options.findIndex((o) => o.label === opt.label) === i,
  );
}

function toDisplayRow(row: ApiReportRow): ReportRow {
  let value: string;
  switch (row.format) {
    case "count":
      value = formatNumberByGeneralSettings(row.amount);
      break;
    case "percent":
      value = `${formatNumberByGeneralSettings(row.amount)}%`;
      break;
    case "currency":
    default:
      value = formatCurrencyByGeneralSettings(row.amount);
      break;
  }
  return { label: row.label, value, sub: row.sub, positive: row.positive };
}

const templates: ReportTemplate[] = [
  {
    id: "expense",
    type: "Expense Report",
    icon: <TrendingDown className="w-5 h-5" />,
    description: "Breakdown of all expenses by project, category, and period",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  {
    id: "income",
    type: "Income Report",
    icon: <TrendingUp className="w-5 h-5" />,
    description: "Summary of all income sources and amounts received",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    id: "cashflow",
    type: "Cash Flow",
    icon: <DollarSign className="w-5 h-5" />,
    description: "Operating, investing, and financing cash flow summary",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    id: "budget",
    type: "Budget vs Actual",
    icon: <BarChart3 className="w-5 h-5" />,
    description: "Compare planned budgets against actual spend by project",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: "payroll",
    type: "Payroll Summary",
    icon: <Users className="w-5 h-5" />,
    description: "Payroll totals by department and period",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
];

export function FinanceReportsPage() {
  const [periodOptions] = useState<PeriodOption[]>(() => buildPeriodOptions());
  const [selectedReport, setSelectedReport] = useState<string>("expense");
  const [period, setPeriod] = useState<string>(
    () => buildPeriodOptions()[0]?.label ?? "",
  );
  const [reportData, setReportData] = useState<Record<string, ReportRow[]>>({});

  useEffect(() => {
    const opt = periodOptions.find((p) => p.label === period);
    const qs = opt
      ? `?from=${encodeURIComponent(opt.from)}&to=${encodeURIComponent(opt.to)}`
      : "";
    apiFetch<Record<string, ApiReportRow[]>>(`/finance-reports${qs}`)
      .then((data) => {
        const mapped: Record<string, ReportRow[]> = {};
        for (const [key, rows] of Object.entries(data ?? {})) {
          if (Array.isArray(rows)) mapped[key] = rows.map(toDisplayRow);
        }
        setReportData(mapped);
      })
      .catch(() => setReportData({}));
  }, [period, periodOptions]);

  function handleExport() {
    exportCSV(
      `finance-report-${selectedReport}-${period.replace(" ", "-")}`,
      ["Metric", "Value", "Note"],
      rows.map((r) => [r.label, r.value, r.sub ?? ""]),
    );
  }

  const active = templates.find((t) => t.id === selectedReport) ?? templates[0];
  const rows = reportData[selectedReport] ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Financial Reports
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Generate and export financial reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {periodOptions.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedReport(t.id)}
            className={`p-4 rounded-xl border text-left transition-all ${selectedReport === t.id ? "border-emerald-300 bg-emerald-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"}`}
          >
            <div
              className={`w-9 h-9 rounded-lg ${t.bg} flex items-center justify-center mb-3 ${t.color}`}
            >
              {t.icon}
            </div>
            <p className="text-xs font-semibold text-gray-900">{t.type}</p>
            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
              {t.description}
            </p>
          </button>
        ))}
      </div>

      {/* Report preview */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg ${active.bg} flex items-center justify-center ${active.color}`}
            >
              {active.icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">
                {active.type}
              </h2>
              <p className="text-xs text-gray-500">Period: {period}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <Eye className="w-3.5 h-3.5" /> Preview
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <FileText className="w-3.5 h-3.5" /> Export PDF
            </button>
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6">
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {active.type} — {period}
              </p>
            </div>
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500">
                    Metric
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">
                    Value
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500">
                    Note
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={`${i === 0 ? "bg-gray-50 font-semibold" : ""} hover:bg-gray-50 transition-colors`}
                  >
                    <td className="px-6 py-3 text-sm text-gray-900">
                      {r.label}
                    </td>
                    <td
                      className={`px-6 py-3 text-sm font-semibold text-right ${r.positive === true ? "text-emerald-600" : r.positive === false ? "text-red-600" : "text-gray-900"}`}
                    >
                      {r.value}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-400 text-right">
                      {r.sub ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer note */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500">
              <strong>Generated:</strong>{" "}
              {formatDateByGeneralSettings(new Date())} ·{" "}
              <strong>Source:</strong> BuildOS Finance Module ·{" "}
              <strong>Period:</strong> {period}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
