import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getTimelines } from "../../api/construction-extras";
import {
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  ExternalLink,
  Search,
  Download,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

interface ProjectTimeline {
  id: string;
  name: string;
  startMonth: number;
  endMonth: number;
  progress: number;
  status: "on-track" | "at-risk" | "delayed";
  manager: string;
  delays?: { reason: string; weeks: number }[];
}

const statusColors = {
  "on-track": { bar: "bg-green-500", badge: "bg-green-100 text-green-700" },
  "at-risk": { bar: "bg-amber-500", badge: "bg-amber-100 text-amber-700" },
  delayed: { bar: "bg-red-500", badge: "bg-red-100 text-red-700" },
};

export function TimelinePlanningPage() {
  const navigate = useNavigate();
  const [timelines, setTimelines] = useState<ProjectTimeline[]>([]);
  useEffect(() => {
    const baseYear = new Date().getFullYear();
    getTimelines()
      .then((data) =>
        setTimelines(
          data.map((t) => {
            const start = new Date(t.startDate);
            const end = new Date(t.endDate);
            return {
              id: t.id,
              name: t.name,
              startMonth:
                (start.getFullYear() - baseYear) * 12 + start.getMonth(),
              endMonth: (end.getFullYear() - baseYear) * 12 + end.getMonth(),
              progress: 0,
              status: (["on-track", "at-risk", "delayed"] as const).includes(
                t.status as ProjectTimeline["status"],
              )
                ? (t.status as ProjectTimeline["status"])
                : "on-track",
              manager: t.projectName || "",
            };
          }),
        ),
      )
      .catch(() => {});
  }, []);
  const [yearOffset, setYearOffset] = useState(0);
  const [adjustFor, setAdjustFor] = useState<string | null>(null);
  const [delayFor, setDelayFor] = useState<string | null>(null);
  const [adjustWeeks, setAdjustWeeks] = useState("2");
  const [delayReason, setDelayReason] = useState("");
  const [delayWeeks, setDelayWeeks] = useState("1");
  const [adjustedIds, setAdjustedIds] = useState<Set<string>>(new Set());
  const [loggedIds, setLoggedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "on-track" | "at-risk" | "delayed"
  >("All");

  const filtered = timelines.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.manager.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  function handleExportCSV() {
    exportCSV(
      "timeline-planning",
      [
        "Project ID",
        "Name",
        "Manager",
        "Status",
        "Progress (%)",
        "Start Month",
        "End Month",
      ],
      filtered.map((t) => [
        t.id,
        t.name,
        t.manager,
        t.status,
        String(t.progress),
        String(t.startMonth),
        String(t.endMonth),
      ]),
    );
  }

  const currentYear = 2026 + yearOffset;
  const displayMonths = MONTHS.map((m, i) => ({
    label: `${m} '${String(currentYear).slice(2)}`,
    monthIndex: i + yearOffset * 12,
  }));

  const delayed = timelines.filter((t) => t.status === "delayed");
  const atRisk = timelines.filter((t) => t.status === "at-risk");

  function handleAdjust(id: string) {
    setAdjustedIds((prev) => new Set(prev).add(id));
    setAdjustFor(null);
    setAdjustWeeks("2");
  }

  function handleLogDelay(id: string) {
    if (!delayReason.trim()) return;
    setLoggedIds((prev) => new Set(prev).add(id));
    setDelayFor(null);
    setDelayReason("");
    setDelayWeeks("1");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Timeline Planning
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Visualise schedules, manage delays, adjust timelines
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border border-gray-200 rounded-md overflow-hidden">
            <button
              onClick={() => setYearOffset((y) => y - 1)}
              className="p-1.5 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="px-3 text-sm font-medium text-gray-700 min-w-[72px] text-center">
              {currentYear}
            </span>
            <button
              onClick={() => setYearOffset((y) => y + 1)}
              className="p-1.5 hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            onClick={() => setYearOffset(0)}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            <Clock className="w-3.5 h-3.5" /> Today
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or managers…"
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex items-center gap-1">
          {(["All", "on-track", "at-risk", "delayed"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s === "All"
                ? "All"
                : s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Delay alerts */}
      {(delayed.length > 0 || atRisk.length > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                Timeline Issues Detected
              </p>
              <div className="mt-2 space-y-1">
                {[...delayed, ...atRisk].map((t) => (
                  <div key={t.id} className="flex items-center gap-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[t.status].badge}`}
                    >
                      {t.status === "delayed" ? "Delayed" : "At Risk"}
                    </span>
                    <span className="text-sm text-red-700">{t.name}</span>
                    {t.delays && (
                      <span className="text-xs text-red-500">
                        — {t.delays[0].reason} (+{t.delays[0].weeks}wks)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gantt grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: "900px" }}>
            {/* Month header */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <div className="w-64 flex-shrink-0 px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-r border-gray-200">
                Project
              </div>
              <div className="flex-1 grid grid-cols-12">
                {displayMonths.map((m) => (
                  <div
                    key={m.label}
                    className="text-center py-2.5 text-xs font-medium text-gray-500 border-r border-gray-100 last:border-0"
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              <div className="w-20 flex-shrink-0 px-2 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </div>
            </div>

            {/* Project rows */}
            {filtered.map((t) => {
              const { bar, badge } = statusColors[t.status];
              const colStart = Math.max(0, t.startMonth - yearOffset * 12);
              const colEnd = Math.min(12, t.endMonth - yearOffset * 12 + 1);
              const visible = colEnd > colStart;
              return (
                <div
                  key={t.id}
                  className="flex items-center border-b border-gray-100 last:border-0 hover:bg-orange-50/30 group cursor-pointer"
                  onClick={() =>
                    navigate(`/apps/construction/projects/${t.id}`)
                  }
                >
                  <div className="w-64 flex-shrink-0 px-4 py-3 border-r border-gray-100">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-orange-700 transition-colors">
                        {t.name}
                      </p>
                      <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-orange-500 flex-shrink-0 transition-colors" />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{t.manager}</p>
                  </div>
                  <div className="flex-1 grid grid-cols-12 relative py-3 px-1">
                    {visible && (
                      <div
                        className={`absolute top-3 h-6 ${bar} rounded-md opacity-80 flex items-center px-2 overflow-hidden`}
                        style={{
                          left: `${(colStart / 12) * 100}%`,
                          width: `${((colEnd - colStart) / 12) * 100}%`,
                        }}
                      >
                        <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-white h-1.5 rounded-full"
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                        <span className="text-white text-xs font-semibold ml-1.5 flex-shrink-0">
                          {t.progress}%
                        </span>
                      </div>
                    )}
                    {!visible && (
                      <div className="col-span-12 text-center text-xs text-gray-300 italic">
                        Not in {currentYear}
                      </div>
                    )}
                    {/* Grid lines */}
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="h-12 border-r border-gray-100 last:border-0"
                      />
                    ))}
                  </div>
                  <div className="w-20 flex-shrink-0 px-2">
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded font-medium ${badge}`}
                    >
                      {t.status.replace("-", " ")}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Adjust timeline panel */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Schedule Adjustments
        </h3>
        <div className="space-y-3">
          {timelines
            .filter((t) => t.status !== "on-track")
            .map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-orange-200"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${statusColors[t.status].badge}`}
                  >
                    {t.status.replace("-", " ")}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {t.name}
                    </p>
                    {t.delays && (
                      <p className="text-xs text-gray-400">
                        {t.delays[0].reason} · {t.delays[0].weeks} weeks delayed
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setAdjustFor(t.id);
                      setDelayFor(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50"
                  >
                    <Edit className="w-3 h-3" />{" "}
                    {adjustedIds.has(t.id) ? "Adjusted ✓" : "Adjust Schedule"}
                  </button>
                  <button
                    onClick={() => {
                      setDelayFor(t.id);
                      setAdjustFor(null);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-orange-600 text-white rounded text-xs hover:bg-orange-700"
                  >
                    <Plus className="w-3 h-3" />{" "}
                    {loggedIds.has(t.id) ? "Delay Logged ✓" : "Log Delay"}
                  </button>
                </div>
                {adjustFor === t.id && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-blue-800">
                      Adjust end date by how many weeks?
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={adjustWeeks}
                        onChange={(e) => setAdjustWeeks(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-500">
                        weeks extension
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdjust(t.id)}
                        className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded font-medium hover:bg-orange-700"
                      >
                        Apply Adjustment
                      </button>
                      <button
                        onClick={() => setAdjustFor(null)}
                        className="px-3 py-1.5 border border-gray-300 text-xs rounded text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {delayFor === t.id && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <p className="text-xs font-medium text-amber-800">
                      Log a delay event
                    </p>
                    <input
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      placeholder="Delay reason…"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={delayWeeks}
                        onChange={(e) => setDelayWeeks(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-20 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-xs text-gray-500">
                        weeks delayed
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleLogDelay(t.id)}
                        disabled={!delayReason.trim()}
                        className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded font-medium hover:bg-orange-700 disabled:opacity-40"
                      >
                        Log Delay
                      </button>
                      <button
                        onClick={() => setDelayFor(null)}
                        className="px-3 py-1.5 border border-gray-300 text-xs rounded text-gray-600 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          {timelines.filter((t) => t.status !== "on-track").length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">
              All projects are on track — no adjustments needed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
