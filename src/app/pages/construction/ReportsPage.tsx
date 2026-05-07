import { useState, useEffect, ReactNode } from "react";
import { useNavigate } from "react-router";
import { getReports, runReport as apiRunReport } from "../../api/reports";
import {
  BarChart3,
  TrendingDown,
  Users,
  Package,
  ExternalLink,
  Download,
  Clock,
  ChevronRight,
  CheckCircle,
} from "lucide-react";

// TODO: No reports endpoint — using placeholder data
const seedReports: {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  color: string;
  lastRun: string;
  frequency: string;
  status: string;
}[] = [];

// TODO: No report runs endpoint — using placeholder data
const recentRuns: {
  title: string;
  project: string;
  generatedBy: string;
  date: string;
  format: string;
}[] = [];

function typeIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "delay":
      return <TrendingDown className="w-6 h-6" />;
    case "resource":
      return <Users className="w-6 h-6" />;
    case "material":
      return <Package className="w-6 h-6" />;
    default:
      return <BarChart3 className="w-6 h-6" />;
  }
}
function typeColor(type: string) {
  switch (type?.toLowerCase()) {
    case "delay":
      return "text-red-600 bg-red-100";
    case "resource":
      return "text-blue-600 bg-blue-100";
    case "material":
      return "text-green-600 bg-green-100";
    default:
      return "text-orange-600 bg-orange-100";
  }
}

export function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState(seedReports);
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [exportedIds, setExportedIds] = useState<Set<string>>(new Set());
  const [downloadedIdxs, setDownloadedIdxs] = useState<Set<number>>(new Set());
  const [showAllRuns, setShowAllRuns] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    getReports("construction")
      .then((items) =>
        setReports(
          items.map((r) => ({
            id: r.id,
            title: r.name,
            description: r.description ?? "",
            icon: typeIcon(r.type),
            color: typeColor(r.type),
            lastRun: r.runs?.[0]?.startedAt?.slice(0, 10) ?? "—",
            frequency: r.schedule ?? "On demand",
            status: "deployed",
          })),
        ),
      )
      .catch(() => {});
  }, []);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function runReport(id: string, title: string) {
    setRunningIds((s) => new Set(s).add(id));
    apiRunReport(id).catch(() => {});
    setTimeout(() => {
      setRunningIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      setCompletedIds((s) => new Set(s).add(id));
      showToast(`"${title}" generated successfully`);
    }, 1500);
  }

  function exportReport(id: string) {
    setExportedIds((s) => new Set(s).add(id));
    setTimeout(
      () =>
        setExportedIds((s) => {
          const n = new Set(s);
          n.delete(id);
          return n;
        }),
      2000,
    );
  }

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toastMsg}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Construction analytics and report templates
          </p>
        </div>
        <button
          onClick={() => navigate("/apps/admin/report-builder")}
          className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Manage Templates
        </button>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-2 gap-4">
        {reports.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-lg border border-gray-200 p-5 hover:border-orange-200 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-4 mb-4">
              <span className={`p-2.5 rounded-xl ${r.color}`}>{r.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-gray-900">
                    {r.title}
                  </h3>
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                    Deployed
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {r.frequency}
                  </span>
                  <span>Last run: {r.lastRun}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {r.description}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => runReport(r.id, r.title)}
                disabled={runningIds.has(r.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  runningIds.has(r.id)
                    ? "bg-orange-400 text-white cursor-not-allowed"
                    : completedIds.has(r.id)
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                }`}
              >
                {runningIds.has(r.id) ? (
                  <>
                    <Clock className="w-3.5 h-3.5" /> Running…
                  </>
                ) : completedIds.has(r.id) ? (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" /> Ran Successfully
                  </>
                ) : (
                  <>
                    <BarChart3 className="w-3.5 h-3.5" /> Run Report
                  </>
                )}
              </button>
              <button
                onClick={() => exportReport(r.id)}
                className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm transition-colors ${
                  exportedIds.has(r.id)
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {exportedIds.has(r.id) ? (
                  "Exported ✓"
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" /> Export
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent report runs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Recent Report Runs
          </h2>
          <button
            onClick={() => setShowAllRuns((s) => !s)}
            className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
          >
            {showAllRuns ? "Show less" : "View all"}{" "}
            <ChevronRight
              className={`w-3 h-3 transition-transform ${showAllRuns ? "rotate-90" : ""}`}
            />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {(showAllRuns ? recentRuns : recentRuns.slice(0, 3)).map((run, i) => (
            <div
              key={i}
              className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50"
            >
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{run.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  By {run.generatedBy} · {run.date}
                </p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                {run.format}
              </span>
              <button
                onClick={() => {
                  setDownloadedIdxs((s) => new Set(s).add(i));
                  showToast(`Downloading "${run.title}"…`);
                  setTimeout(
                    () =>
                      setDownloadedIdxs((s) => {
                        const n = new Set(s);
                        n.delete(i);
                        return n;
                      }),
                    2000,
                  );
                }}
                className={`p-1.5 rounded-md hover:bg-gray-100 transition-colors ${downloadedIdxs.has(i) ? "text-green-600" : "text-gray-400 hover:text-gray-600"}`}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Note about report portal */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <strong>Report Templates</strong> are managed centrally in the Admin →
          Report Builder. Reports deployed to the Construction app appear here
          automatically.
        </p>
      </div>
    </div>
  );
}
