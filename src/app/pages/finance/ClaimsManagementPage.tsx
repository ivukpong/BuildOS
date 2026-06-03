import { useState, useEffect } from "react";
import {
  fetchClaims,
  approveClaim,
  rejectClaim,
  payClaim,
  updateClaimStatus,
} from "../../api/claims";
import {
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";

type ClaimStatus =
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Rejected"
  | "Paid";

interface Claim {
  id: string;
  employee: string;
  department: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  status: ClaimStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  paidAt?: string;
}

const statusConfig: Record<
  ClaimStatus,
  { badge: string; icon: React.ReactNode }
> = {
  Submitted: {
    badge: "bg-blue-100 text-blue-700",
    icon: <Clock className="w-3 h-3" />,
  },
  "Under Review": {
    badge: "bg-amber-100 text-amber-700",
    icon: <Clock className="w-3 h-3" />,
  },
  Approved: {
    badge: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
  Rejected: {
    badge: "bg-red-100 text-red-700",
    icon: <XCircle className="w-3 h-3" />,
  },
  Paid: {
    badge: "bg-teal-100 text-teal-700",
    icon: <CheckCircle className="w-3 h-3" />,
  },
};

const STATUS_OPTS: Array<ClaimStatus | "All"> = [
  "All",
  "Submitted",
  "Under Review",
  "Approved",
  "Rejected",
  "Paid",
];

export function ClaimsManagementPage() {
  const [claims, setClaims] = useState<Claim[]>([]);

  function toClaim(c: any): Claim {
    const status: ClaimStatus =
      c.status === "Submitted" ||
      c.status === "Under Review" ||
      c.status === "Approved" ||
      c.status === "Rejected" ||
      c.status === "Paid"
        ? c.status
        : "Submitted";
    return {
      id: c.id,
      employee: c.employee ?? "",
      department: c.department ?? "",
      type: c.type ?? "",
      amount: Number(c.amount ?? 0),
      description: c.description ?? "",
      date: c.date ?? "",
      status,
      reviewedBy: c.reviewedBy,
      reviewedAt: c.reviewedAt,
      rejectionReason: c.rejectionReason,
      paidAt: c.paidAt,
    };
  }

  useEffect(() => {
    fetchClaims().then((items) => setClaims(items.map(toClaim)));
  }, []);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClaimStatus | "All">("All");
  const [viewClaim, setViewClaim] = useState<Claim | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [rejectState, setRejectState] = useState<{
    id: string;
    reason: string;
  } | null>(null);

  const fmt = (n: number) => `$${n.toLocaleString()}`;

  const filtered = claims
    .filter((c) => {
      if (statusFilter !== "All" && c.status !== statusFilter) return false;
      if (
        search &&
        !c.id.toLowerCase().includes(search.toLowerCase()) &&
        !c.employee.toLowerCase().includes(search.toLowerCase()) &&
        !c.type.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) =>
      sortDir === "desc" ? b.amount - a.amount : a.amount - b.amount,
    );

  function approve(id: string) {
    approveClaim(id)
      .then(() => {
        fetchClaims()
          .then((items) => setClaims(items.map(toClaim)))
          .catch(console.error);
      })
      .catch((err) => {
        alert("Failed to approve claim. Please try again.");
        console.error(err);
      });
    setViewClaim(null);
  }

  function submitReject() {
    if (!rejectState || !rejectState.reason.trim()) return;
    rejectClaim(rejectState.id, rejectState.reason)
      .then(() => {
        fetchClaims()
          .then((items) => setClaims(items.map(toClaim)))
          .catch(console.error);
      })
      .catch((err) => {
        alert("Failed to reject claim. Please try again.");
        console.error(err);
      });
    setRejectState(null);
    setViewClaim(null);
  }

  function markPaid(id: string) {
    payClaim(id)
      .then(() => {
        fetchClaims()
          .then((items) => setClaims(items.map(toClaim)))
          .catch(console.error);
      })
      .catch((err) => {
        alert("Failed to mark claim as paid. Please try again.");
        console.error(err);
      });
    setViewClaim(null);
  }

  function setUnderReview(id: string) {
    updateClaimStatus(id, "UnderReview")
      .then(() => {
        fetchClaims()
          .then((items) => setClaims(items.map(toClaim)))
          .catch(console.error);
      })
      .catch((err) => {
        alert("Failed to set claim under review. Please try again.");
        console.error(err);
      });
    setViewClaim(null);
  }

  function handleExport() {
    exportCSV(
      "claims",
      [
        "Claim ID",
        "Employee",
        "Department",
        "Type",
        "Amount",
        "Date",
        "Status",
      ],
      claims.map((c) => [
        c.id,
        c.employee,
        c.department,
        c.type,
        fmt(c.amount),
        c.date,
        c.status,
      ]),
    );
  }

  const totalApproved = claims
    .filter((c) => c.status === "Approved" || c.status === "Paid")
    .reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Claims Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Review and process employee claims from ESS
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
          Claims submitted by employees via <strong>ESS</strong> appear here for
          finance review and payment. Claim types are configured under{" "}
          <strong>HR Configuration</strong>.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Claims</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {claims.length}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {
              claims.filter((c) =>
                ["Submitted", "Under Review"].includes(c.status),
              ).length
            }
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Approved Amount</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {fmt(totalApproved)}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Rejected</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {claims.filter((c) => c.status === "Rejected").length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claims..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {STATUS_OPTS.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${statusFilter === s ? "bg-emerald-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Claim ID
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Employee
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Type
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Description
              </th>
              <th
                className="text-left px-5 py-3 text-xs font-semibold text-gray-500 cursor-pointer select-none"
                onClick={() =>
                  setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                }
              >
                <span className="flex items-center gap-1">
                  Amount{" "}
                  {sortDir === "asc" ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Date
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500">
                Status
              </th>
              <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-xs font-mono text-gray-500">
                  {c.id}
                </td>
                <td className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {c.employee}
                  </p>
                  <p className="text-xs text-gray-400">{c.department}</p>
                </td>
                <td className="px-5 py-3">
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                    {c.type}
                  </span>
                </td>
                <td className="px-5 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {c.description}
                </td>
                <td className="px-5 py-3 text-sm font-semibold text-gray-900">
                  {fmt(c.amount)}
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{c.date}</td>
                <td className="px-5 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig[c.status].badge}`}
                  >
                    {statusConfig[c.status].icon}
                    {c.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button
                    onClick={() => setViewClaim(c)}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-5 py-12 text-center text-sm text-gray-400"
                >
                  No claims found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Claim Modal */}
      {viewClaim && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-xs text-gray-500">
                    {viewClaim.id}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full font-medium ${statusConfig[viewClaim.status].badge}`}
                  >
                    {statusConfig[viewClaim.status].icon}
                    {viewClaim.status}
                  </span>
                </div>
                <h2 className="text-sm font-semibold text-gray-900">
                  {viewClaim.employee}
                </h2>
              </div>
              <button
                onClick={() => {
                  setViewClaim(null);
                  setRejectState(null);
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Claim Type</p>
                  <p className="text-sm font-medium mt-0.5">{viewClaim.type}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="text-sm font-medium mt-0.5">
                    {viewClaim.department}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-xl font-bold text-gray-900 mt-0.5">
                    {fmt(viewClaim.amount)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Submitted</p>
                  <p className="text-sm font-medium mt-0.5">{viewClaim.date}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm text-gray-800 mt-0.5">
                  {viewClaim.description}
                </p>
              </div>
              {viewClaim.reviewedBy && (
                <div
                  className={`rounded-lg p-3 ${viewClaim.status === "Rejected" ? "bg-red-50" : "bg-emerald-50"}`}
                >
                  <p
                    className={`text-xs font-semibold ${viewClaim.status === "Rejected" ? "text-red-700" : "text-emerald-700"}`}
                  >
                    {viewClaim.status === "Rejected" ? "Rejected" : "Reviewed"}{" "}
                    by {viewClaim.reviewedBy} · {viewClaim.reviewedAt}
                  </p>
                  {viewClaim.rejectionReason && (
                    <p className="text-xs text-red-600 mt-0.5">
                      {viewClaim.rejectionReason}
                    </p>
                  )}
                </div>
              )}
              {viewClaim.paidAt && (
                <p className="text-xs text-teal-700 font-medium">
                  ✓ Paid on {viewClaim.paidAt}
                </p>
              )}
              {rejectState?.id === viewClaim.id && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectState.reason}
                    onChange={(e) =>
                      setRejectState({ ...rejectState, reason: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              {viewClaim.status === "Submitted" && !rejectState && (
                <button
                  onClick={() => setUnderReview(viewClaim.id)}
                  className="px-4 py-2 text-sm border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50"
                >
                  Start Review
                </button>
              )}
              {viewClaim.status === "Under Review" && !rejectState && (
                <>
                  <button
                    onClick={() =>
                      setRejectState({ id: viewClaim.id, reason: "" })
                    }
                    className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => approve(viewClaim.id)}
                    className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                </>
              )}
              {rejectState?.id === viewClaim.id && (
                <>
                  <button
                    onClick={() => setRejectState(null)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitReject}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    Confirm Rejection
                  </button>
                </>
              )}
              {viewClaim.status === "Approved" && (
                <button
                  onClick={() => markPaid(viewClaim.id)}
                  className="px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700"
                >
                  Mark as Paid
                </button>
              )}
              {!["Submitted", "Under Review", "Approved"].includes(
                viewClaim.status,
              ) &&
                !rejectState && (
                  <button
                    onClick={() => setViewClaim(null)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
