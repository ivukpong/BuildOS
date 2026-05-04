import { useState, useEffect } from "react";
import {
  ListTodo,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Flag,
  User,
  ChevronDown,
  X,
  Trash2,
  Edit,
  Download,
} from "lucide-react";
import { exportCSV } from "../../utils/exportCSV";
import { fetchProjects } from "../../api/projects";
import { fetchEmployees } from "../../api/employees";

// ─── Types ───────────────────────────────────────────────────────────────────

type Priority = "low" | "medium" | "high" | "critical";
type TaskStatus = "todo" | "in-progress" | "done" | "blocked";

interface Task {
  id: string;
  name: string;
  project: string;
  description: string;
  startDate: string;
  endDate: string;
  priority: Priority;
  status: TaskStatus;
  dependencies: string[];
  assignees: AssignedWorker[];
}

interface AssignedWorker {
  workerId: string;
  name: string;
  role: string;
  hoursPerDay: number;
  hoursPerWeek: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

// allWorkers loaded from API — see component state below
// allProjects loaded from API — see component state below

// TODO: No tasks endpoint — using placeholder data

// ─── Config ───────────────────────────────────────────────────────────────────

const priorityConfig: Record<
  Priority,
  { badge: string; dot: string; label: string }
> = {
  low: { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400", label: "Low" },
  medium: {
    badge: "bg-blue-100 text-blue-700",
    dot: "bg-blue-500",
    label: "Medium",
  },
  high: {
    badge: "bg-orange-100 text-orange-700",
    dot: "bg-orange-500",
    label: "High",
  },
  critical: {
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    label: "Critical",
  },
};

const statusConfig: Record<TaskStatus, { badge: string; label: string }> = {
  todo: { badge: "bg-gray-100 text-gray-600", label: "To Do" },
  "in-progress": { badge: "bg-blue-100 text-blue-700", label: "In Progress" },
  done: { badge: "bg-green-100 text-green-700", label: "Done" },
  blocked: { badge: "bg-red-100 text-red-700", label: "Blocked" },
};

// ─── Empty Form ───────────────────────────────────────────────────────────────

const emptyForm = {
  name: "",
  project: "",
  description: "",
  startDate: "",
  endDate: "",
  priority: "medium" as Priority,
  status: "todo" as TaskStatus,
  dependencies: [] as string[],
};

// ─── Assign Worker Modal ──────────────────────────────────────────────────────

function AssignWorkerModal({
  taskId,
  existing,
  workers,
  onSave,
  onClose,
}: {
  taskId: string;
  existing: AssignedWorker[];
  workers: { id: string; name: string; role: string }[];
  onSave: (taskId: string, worker: AssignedWorker) => void;
  onClose: () => void;
}) {
  const [workerId, setWorkerId] = useState("");
  const [hoursPerDay, setHoursPerDay] = useState(8);
  const [hoursPerWeek, setHoursPerWeek] = useState(40);

  const selectedWorker = workers.find((w) => w.id === workerId);
  const alreadyAssigned = existing.map((a) => a.workerId);
  const available = workers.filter((w) => !alreadyAssigned.includes(w.id));

  function handleSave() {
    if (!selectedWorker) return;
    onSave(taskId, {
      workerId: selectedWorker.id,
      name: selectedWorker.name,
      role: selectedWorker.role,
      hoursPerDay,
      hoursPerWeek,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Assign Worker</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Worker
            </label>
            <select
              value={workerId}
              onChange={(e) => setWorkerId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select worker…</option>
              {available.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {w.role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              readOnly
              value={selectedWorker?.role ?? ""}
              placeholder="Role auto-fills"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-gray-50 text-gray-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours / Day
              </label>
              <input
                type="number"
                min={1}
                max={16}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hours / Week
              </label>
              <input
                type="number"
                min={1}
                max={80}
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleSave}
            disabled={!workerId}
            className="flex-1 bg-orange-600 text-white py-2 rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Assign Worker
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Task Modal ──────────────────────────────────────────────────────────

function EditTaskModal({
  task,
  projects,
  onSave,
  onClose,
}: {
  task: Task;
  projects: string[];
  onSave: (updated: Task) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: task.name,
    project: task.project,
    description: task.description,
    startDate: task.startDate,
    endDate: task.endDate,
    priority: task.priority,
    status: task.status,
  });
  const set = (k: keyof typeof form, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Edit Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={form.project}
              onChange={(e) => set("project", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
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
                onChange={(e) => set("endDate", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as TaskStatus)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => onSave({ ...task, ...form })}
            disabled={!form.name || !form.project}
            className="flex-1 bg-orange-600 text-white py-2 rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-40"
          >
            Save Changes
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Task Modal ───────────────────────────────────────────────────────────

function AddTaskModal({
  tasks,
  projects,
  onSave,
  onClose,
}: {
  tasks: Task[];
  projects: string[];
  onSave: (t: typeof emptyForm) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...emptyForm });
  const set = (k: keyof typeof emptyForm, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Install rooftop waterproofing"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          {/* Project */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project <span className="text-red-500">*</span>
            </label>
            <select
              value={form.project}
              onChange={(e) => set("project", e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select project…</option>
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe the task scope and deliverables…"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => set("priority", e.target.value as Priority)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value as TaskStatus)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
          {/* Dependencies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dependencies
            </label>
            <div className="space-y-1 max-h-36 overflow-y-auto border border-gray-200 rounded-md p-2">
              {tasks.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 py-0.5 rounded"
                >
                  <input
                    type="checkbox"
                    checked={form.dependencies.includes(t.id)}
                    onChange={(e) =>
                      set(
                        "dependencies",
                        e.target.checked
                          ? [...form.dependencies, t.id]
                          : form.dependencies.filter((d) => d !== t.id),
                      )
                    }
                    className="accent-orange-600"
                  />
                  <span className="truncate">{t.name}</span>
                  <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
                    {t.project.slice(0, 15)}…
                  </span>
                </label>
              ))}
              {tasks.length === 0 && (
                <p className="text-xs text-gray-400 py-2 text-center">
                  No existing tasks to depend on
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => onSave(form)}
            disabled={
              !form.name || !form.project || !form.startDate || !form.endDate
            }
            className="flex-1 bg-orange-600 text-white py-2 rounded-md text-sm font-medium hover:bg-orange-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Create Task
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "all">("all");
  const [showAddTask, setShowAddTask] = useState(false);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editFor, setEditFor] = useState<string | null>(null);
  const [allProjects, setAllProjects] = useState<string[]>([]);
  const [allWorkers, setAllWorkers] = useState<
    { id: string; name: string; role: string }[]
  >([]);
  useEffect(() => {
    fetchProjects()
      .then((ps) => setAllProjects(ps.map((p) => p.name)))
      .catch(() => {});
    fetchEmployees()
      .then((es) =>
        setAllWorkers(
          es.map((e) => ({
            id: e.id,
            name: `${e.firstName} ${e.lastName}`,
            role: e.role,
          })),
        ),
      )
      .catch(() => {});
  }, []);

  const projects = ["All", ...allProjects];

  const filtered = tasks.filter((t) => {
    const matchSearch =
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.project.toLowerCase().includes(search.toLowerCase());
    const matchProject = projectFilter === "All" || t.project === projectFilter;
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchPriority =
      priorityFilter === "all" || t.priority === priorityFilter;
    return matchSearch && matchProject && matchStatus && matchPriority;
  });

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    done: tasks.filter((t) => t.status === "done").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
  };

  function handleAddTask(form: typeof emptyForm) {
    const newTask: Task = { ...form, id: `t${Date.now()}`, assignees: [] };
    setTasks((ts) => [...ts, newTask]);
    setShowAddTask(false);
  }

  function handleAssignWorker(taskId: string, worker: AssignedWorker) {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId ? { ...t, assignees: [...t.assignees, worker] } : t,
      ),
    );
    setAssignFor(null);
  }

  function removeAssignee(taskId: string, workerId: string) {
    setTasks((ts) =>
      ts.map((t) =>
        t.id === taskId
          ? {
              ...t,
              assignees: t.assignees.filter((a) => a.workerId !== workerId),
            }
          : t,
      ),
    );
  }

  function deleteTask(taskId: string) {
    setTasks((ts) => ts.filter((t) => t.id !== taskId));
    setOpenMenu(null);
  }

  function handleEditTask(updated: Task) {
    setTasks((ts) => ts.map((t) => (t.id === updated.id ? updated : t)));
    setEditFor(null);
  }

  const taskForAssign = tasks.find((t) => t.id === assignFor);
  const taskForEdit = tasks.find((t) => t.id === editFor);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Create and manage construction tasks across all projects
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const headers = [
                "Task ID",
                "Name",
                "Project",
                "Start Date",
                "End Date",
                "Priority",
                "Status",
                "Assignees",
                "Dependencies",
              ];
              const rows = filtered.map((t) => [
                t.id,
                t.name,
                t.project,
                t.startDate,
                t.endDate,
                priorityConfig[t.priority].label,
                statusConfig[t.status].label,
                t.assignees.map((a) => a.name).join("; "),
                t.dependencies
                  .map((d) => tasks.find((x) => x.id === d)?.name ?? d)
                  .join("; "),
              ]);
              exportCSV("construction-tasks", headers, rows);
            }}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            <Download className="w-4 h-4" /> Export
          </button>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-orange-700"
          >
            <Plus className="w-4 h-4" /> Add Task
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-3">
        {(["todo", "in-progress", "done", "blocked"] as const).map((s) => {
          const cfg = statusConfig[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "all" : s)}
              className={`rounded-lg border p-3 text-left transition-all ${statusFilter === s ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:border-gray-300"}`}
            >
              <p className="text-xs text-gray-500 capitalize">{cfg.label}</p>
              <p className="text-2xl font-bold text-gray-900">{counts[s]}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks…"
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
          />
        </div>
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          {projects.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as any)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          <option value="all">All Priorities</option>
          {(["low", "medium", "high", "critical"] as const).map((p) => (
            <option key={p} value={p} className="capitalize">
              {priorityConfig[p].label}
            </option>
          ))}
        </select>
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Task
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Project
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Dates
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assignees
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Deps
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((t) => {
              const pc = priorityConfig[t.priority];
              const sc = statusConfig[t.status];
              const depNames = t.dependencies.map(
                (d) => tasks.find((x) => x.id === d)?.name ?? d,
              );
              return (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    {t.description && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {t.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full line-clamp-1">
                      {t.project.slice(0, 22)}
                      {t.project.length > 22 ? "…" : ""}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{t.startDate.slice(5)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <span className="w-3" />→ {t.endDate.slice(5)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${pc.badge}`}
                      >
                        {pc.label}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.badge}`}
                    >
                      {sc.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {t.assignees.slice(0, 3).map((a) => (
                        <div
                          key={a.workerId}
                          title={`${a.name} (${a.role})`}
                          className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 cursor-pointer"
                          onClick={() => removeAssignee(t.id, a.workerId)}
                        >
                          {a.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </div>
                      ))}
                      {t.assignees.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{t.assignees.length - 3}
                        </span>
                      )}
                      <button
                        onClick={() => setAssignFor(t.id)}
                        className="w-7 h-7 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-orange-400 hover:text-orange-500 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {depNames.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {depNames.slice(0, 2).map((d, i) => (
                          <span
                            key={i}
                            className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded"
                          >
                            {d.slice(0, 14)}
                            {d.length > 14 ? "…" : ""}
                          </span>
                        ))}
                        {depNames.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{depNames.length - 2}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={() =>
                        setOpenMenu(openMenu === t.id ? null : t.id)
                      }
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenu === t.id && (
                      <div className="absolute right-4 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-36">
                        <button
                          onClick={() => {
                            setAssignFor(t.id);
                            setOpenMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <User className="w-3.5 h-3.5" /> Assign Worker
                        </button>
                        <button
                          onClick={() => {
                            setEditFor(t.id);
                            setOpenMenu(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit Task
                        </button>
                        <button
                          onClick={() => deleteTask(t.id)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <ListTodo className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No tasks found</p>
            <button
              onClick={() => setShowAddTask(true)}
              className="mt-3 text-orange-600 text-sm font-medium hover:text-orange-700"
            >
              Create your first task →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddTask && (
        <AddTaskModal
          tasks={tasks}
          projects={allProjects}
          onSave={handleAddTask}
          onClose={() => setShowAddTask(false)}
        />
      )}
      {assignFor && taskForAssign && (
        <AssignWorkerModal
          taskId={assignFor}
          existing={taskForAssign.assignees}
          workers={allWorkers}
          onSave={handleAssignWorker}
          onClose={() => setAssignFor(null)}
        />
      )}
      {editFor && taskForEdit && (
        <EditTaskModal
          task={taskForEdit}
          projects={allProjects}
          onSave={handleEditTask}
          onClose={() => setEditFor(null)}
        />
      )}

      {/* Dismiss dropdown on outside click */}
      {openMenu && (
        <div className="fixed inset-0 z-0" onClick={() => setOpenMenu(null)} />
      )}
    </div>
  );
}
