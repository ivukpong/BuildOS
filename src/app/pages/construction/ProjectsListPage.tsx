import { useState, useEffect } from "react";
import { fetchProjects } from "../../api/projects";
import { useNavigate } from "react-router";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Filter,
  FolderKanban,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpDown,
} from "lucide-react";

type ProjectStatus =
  | "Active"
  | "Planning"
  | "On Hold"
  | "Completed"
  | "Cancelled";
type ProjectType =
  | "Commercial"
  | "Residential"
  | "Industrial"
  | "Infrastructure"
  | "Renovation";

interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
  state: string;
  city: string;
  status: ProjectStatus;
  type: ProjectType;
  budget: number;
  spent: number;
  progress: number;
  startDate: string;
  endDate: string;
  manager: string;
  team: number;
}

const statusConfig: Record<
  ProjectStatus,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  Active: {
    label: "Active",
    icon: <CheckCircle className="w-3 h-3" />,
    color: "text-green-700",
    bg: "bg-green-100",
  },
  Planning: {
    label: "Planning",
    icon: <Clock className="w-3 h-3" />,
    color: "text-blue-700",
    bg: "bg-blue-100",
  },
  "On Hold": {
    label: "On Hold",
    icon: <Clock className="w-3 h-3" />,
    color: "text-amber-700",
    bg: "bg-amber-100",
  },
  Completed: {
    label: "Completed",
    icon: <CheckCircle className="w-3 h-3" />,
    color: "text-gray-700",
    bg: "bg-gray-100",
  },
  Cancelled: {
    label: "Cancelled",
    icon: <XCircle className="w-3 h-3" />,
    color: "text-red-700",
    bg: "bg-red-100",
  },
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  const c = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.color}`}
    >
      {c.icon}
      {c.label}
    </span>
  );
}

const NEW_PROJECT_DEFAULTS = {
  name: "",
  client: "",
  state: "",
  city: "",
  address: "",
  startDate: "",
  endDate: "",
  budget: "",
  type: "Commercial" as ProjectType,
  manager: "",
};

export function ProjectsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "All">(
    "All",
  );
  const [typeFilter, setTypeFilter] = useState<ProjectType | "All">("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<keyof Project | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(NEW_PROJECT_DEFAULTS);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [projectList, setProjectList] = useState<Project[]>([]);

  function toProject(p: any): Project {
    const status: ProjectStatus =
      p.status === "Active" ||
      p.status === "Planning" ||
      p.status === "On Hold" ||
      p.status === "Completed" ||
      p.status === "Cancelled"
        ? p.status
        : "Planning";
    const type: ProjectType =
      p.type === "Commercial" ||
      p.type === "Residential" ||
      p.type === "Industrial" ||
      p.type === "Infrastructure" ||
      p.type === "Renovation"
        ? p.type
        : "Commercial";
    return {
      id: p.id,
      name: p.name ?? "",
      client: p.client ?? "",
      location: p.location ?? "",
      state: p.state ?? "",
      city: p.city ?? "",
      status,
      type,
      budget: Number(p.budget ?? 0),
      spent: Number(p.spent ?? 0),
      progress: Number(p.progress ?? 0),
      startDate: p.startDate ?? "",
      endDate: p.endDate ?? "",
      manager: p.manager ?? "",
      team: Array.isArray(p.team) ? p.team.length : Number(p.team ?? 0),
    };
  }

  useEffect(() => {
    fetchProjects().then((items) => setProjectList(items.map(toProject)));
  }, []);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const managers = Array.from(new Set(projectList.map((p) => p.manager)));

  function handleDelete(id: string) {
    setProjectList((prev) => prev.filter((p) => p.id !== id));
    setDeleteConfirmId(null);
  }

  function handleEditSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editProject) return;
    setProjectList((prev) =>
      prev.map((p) => (p.id === editProject.id ? editProject : p)),
    );
    setEditProject(null);
  }

  function toggleSort(field: keyof Project) {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  let displayed = projectList.filter((p) => {
    const q = search.toLowerCase();
    if (
      q &&
      !p.name.toLowerCase().includes(q) &&
      !p.client.toLowerCase().includes(q) &&
      !p.location.toLowerCase().includes(q)
    )
      return false;
    if (statusFilter !== "All" && p.status !== statusFilter) return false;
    if (typeFilter !== "All" && p.type !== typeFilter) return false;
    if (managerFilter !== "All" && p.manager !== managerFilter) return false;
    return true;
  });

  if (sortField) {
    displayed = [...displayed].sort((a, b) => {
      const va = a[sortField];
      const vb = b[sortField];
      if (typeof va === "number" && typeof vb === "number")
        return sortDir === "asc" ? va - vb : vb - va;
      return sortDir === "asc"
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }

  const counts: Record<string, number> = { All: projectList.length };
  projectList.forEach((p) => {
    counts[p.status] = (counts[p.status] ?? 0) + 1;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">All Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {projectList.length} projects total
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Status tab row */}
      <div className="flex gap-1 border-b border-gray-200">
        {(
          [
            "All",
            "Active",
            "Planning",
            "On Hold",
            "Completed",
            "Cancelled",
          ] as const
        ).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              statusFilter === s
                ? "border-orange-600 text-orange-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {s}{" "}
            {counts[s] !== undefined && (
              <span className="ml-1 text-xs font-normal text-gray-400">
                ({counts[s]})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filters row */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, client, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters((f) => !f)}
          className={`flex items-center gap-1.5 px-3 py-2 border rounded-md text-sm transition-colors ${
            showFilters
              ? "border-orange-400 bg-orange-50 text-orange-700"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`}
          />
        </button>
        <span className="text-sm text-gray-400">
          {displayed.length} result{displayed.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex gap-4 flex-wrap">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Types</option>
              {(
                [
                  "Commercial",
                  "Residential",
                  "Industrial",
                  "Infrastructure",
                  "Renovation",
                ] as const
              ).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Manager
            </label>
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className="border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="All">All Managers</option>
              {managers.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setTypeFilter("All");
              setManagerFilter("All");
              setSearch("");
              setStatusFilter("All");
            }}
            className="self-end text-xs text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { key: "name", label: "Project" },
                { key: "type", label: "Type" },
                { key: "status", label: "Status" },
                { key: "progress", label: "Progress" },
                { key: "budget", label: "Budget" },
                { key: "manager", label: "Manager" },
                { key: "endDate", label: "Due Date" },
                { key: "team", label: "Team" },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key as keyof Project)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 select-none"
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {displayed.map((p) => {
              const budgetPct = Math.round((p.spent / p.budget) * 100);
              return (
                <tr
                  key={p.id}
                  onClick={() =>
                    navigate(`/apps/construction/projects/${p.id}`)
                  }
                  className="hover:bg-gray-50 cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors">
                        {p.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {p.location}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      {p.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${p.progress === 100 ? "bg-green-500" : p.status === "On Hold" ? "bg-amber-500" : "bg-orange-500"}`}
                          style={{ width: `${p.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">
                        {p.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {fmt(p.budget)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fmt(p.spent)} spent ({budgetPct}%)
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {p.manager
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)}
                      </div>
                      <span className="text-sm text-gray-700 truncate">
                        {p.manager}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      {new Date(p.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      {p.team}
                    </div>
                  </td>
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenu(openMenu === p.id ? null : p.id)
                        }
                        className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                      {openMenu === p.id && (
                        <div
                          className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1"
                          onMouseLeave={() => setOpenMenu(null)}
                        >
                          <button
                            onClick={() => {
                              navigate(`/apps/construction/projects/${p.id}`);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Details
                          </button>
                          <button
                            onClick={() => {
                              setEditProject(p);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            onClick={() => {
                              setDeleteConfirmId(p.id);
                              setOpenMenu(null);
                            }}
                            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {displayed.length === 0 && (
          <div className="py-16 text-center">
            <FolderKanban className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">
              No projects found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>

      {/* Edit Project Modal */}
      {editProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Edit Project
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {editProject.name}
                </p>
              </div>
              <button
                onClick={() => setEditProject(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form className="p-6 space-y-5" onSubmit={handleEditSave}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editProject.name}
                    onChange={(e) =>
                      setEditProject(
                        (ep) => ep && { ...ep, name: e.target.value },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <input
                    type="text"
                    required
                    value={editProject.client}
                    onChange={(e) =>
                      setEditProject(
                        (ep) => ep && { ...ep, client: e.target.value },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={editProject.type}
                    onChange={(e) =>
                      setEditProject(
                        (ep) =>
                          ep && { ...ep, type: e.target.value as ProjectType },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {(
                      [
                        "Commercial",
                        "Residential",
                        "Industrial",
                        "Infrastructure",
                        "Renovation",
                      ] as ProjectType[]
                    ).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editProject.status}
                    onChange={(e) =>
                      setEditProject(
                        (ep) =>
                          ep && {
                            ...ep,
                            status: e.target.value as ProjectStatus,
                          },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {(
                      [
                        "Active",
                        "Planning",
                        "On Hold",
                        "Completed",
                        "Cancelled",
                      ] as ProjectStatus[]
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={editProject.state}
                    onChange={(e) =>
                      setEditProject(
                        (ep) => ep && { ...ep, state: e.target.value },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={editProject.city}
                    onChange={(e) =>
                      setEditProject(
                        (ep) => ep && { ...ep, city: e.target.value },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editProject.startDate}
                    onChange={(e) =>
                      setEditProject(
                        (ep) => ep && { ...ep, startDate: e.target.value },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editProject.endDate}
                    onChange={(e) =>
                      setEditProject(
                        (ep) => ep && { ...ep, endDate: e.target.value },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    value={editProject.budget}
                    onChange={(e) =>
                      setEditProject(
                        (ep) => ep && { ...ep, budget: Number(e.target.value) },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Manager
                  </label>
                  <input
                    type="text"
                    value={editProject.manager}
                    onChange={(e) =>
                      setEditProject(
                        (ep) => ep && { ...ep, manager: e.target.value },
                      )
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditProject(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirmId &&
        (() => {
          const proj = projectList.find((p) => p.id === deleteConfirmId);
          return proj ? (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Delete Project
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Are you sure you want to delete{" "}
                      <span className="font-medium text-gray-700">
                        "{proj.name}"
                      </span>
                      ? This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirmId)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : null;
        })()}

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Project
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Set up a new construction project
                </p>
              </div>
              <button
                onClick={() => setShowCreate(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form
              className="p-6 space-y-5"
              onSubmit={(e) => {
                e.preventDefault();
                setShowCreate(false);
                setForm(NEW_PROJECT_DEFAULTS);
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Harbour View Tower"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.client}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, client: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Type
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, type: e.target.value as any }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {[
                      "Commercial",
                      "Residential",
                      "Industrial",
                      "Infrastructure",
                      "Renovation",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, state: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. TX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="e.g. Austin"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Site Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Full address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startDate: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endDate: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, budget: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned Manager
                  </label>
                  <input
                    type="text"
                    value={form.manager}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, manager: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="Manager name"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
