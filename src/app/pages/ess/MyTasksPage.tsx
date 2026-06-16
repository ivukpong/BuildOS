import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Filter,
  Briefcase,
  Plus,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { fetchProjects } from "../../api/projects";
import { getTasks, createTask } from "../../api/tasks";

type TaskStatus = "done" | "in-progress" | "todo" | "blocked";

interface Task {
  id: string;
  name: string;
  project: string;
  status: TaskStatus;
  due: string;
  priority: "low" | "medium" | "high";
  description?: string;
}

const statusConfig: Record<
  TaskStatus,
  { icon: React.ReactNode; badge: string; label: string }
> = {
  done: {
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    badge: "bg-green-100 text-green-700",
    label: "Done",
  },
  "in-progress": {
    icon: <Clock className="w-4 h-4 text-blue-500" />,
    badge: "bg-blue-100 text-blue-700",
    label: "In Progress",
  },
  todo: {
    icon: <Clock className="w-4 h-4 text-gray-400" />,
    badge: "bg-gray-100 text-gray-600",
    label: "To Do",
  },
  blocked: {
    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
    badge: "bg-red-100 text-red-700",
    label: "Blocked",
  },
};

const priorityConfig = {
  low: { dot: "bg-green-400", label: "Low" },
  medium: { dot: "bg-yellow-400", label: "Medium" },
  high: { dot: "bg-red-400", label: "High" },
};

// allProjects loaded from API — see component state below

export function MyTasksPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [showModal, setShowModal] = useState(false);
  const [allProjects, setAllProjects] = useState<string[]>([]);
  useEffect(() => {
    fetchProjects()
      .then((ps) => setAllProjects(ps.map((p) => p.name)))
      .catch(() => {});
    getTasks()
      .then((ts) =>
        setTasks(
          ts.map((t) => ({
            id: t.id,
            name: t.title,
            project: t.projectName ?? "",
            status: t.status as TaskStatus,
            due: t.dueDate?.slice(0, 10) ?? "",
            priority: t.priority as Task["priority"],
            description: t.description,
          })),
        ),
      )
      .catch(() => {});
  }, []);
  const [form, setForm] = useState({
    name: "",
    project: "",
    due: today,
    priority: "medium" as Task["priority"],
    description: "",
  });

  const filtered =
    statusFilter === "all"
      ? tasks
      : tasks.filter((t) => t.status === statusFilter);

  const counts = {
    all: tasks.length,
    "in-progress": tasks.filter((t) => t.status === "in-progress").length,
    todo: tasks.filter((t) => t.status === "todo").length,
    blocked: tasks.filter((t) => t.status === "blocked").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  function saveTask() {
    if (!form.name.trim()) return;
    createTask({
      title: form.name,
      projectName: form.project,
      dueDate: form.due || undefined,
      priority: form.priority,
      status: "todo",
      description: form.description,
    })
      .then((t) =>
        setTasks((prev) => [
          ...prev,
          {
            id: t.id,
            name: t.title,
            project: t.projectName ?? "",
            status: t.status as TaskStatus,
            due: t.dueDate?.slice(0, 10) ?? "",
            priority: t.priority as Task["priority"],
            description: t.description,
          },
        ]),
      )
      .catch(() => {});
    setForm({
      name: "",
      project: allProjects[0] || "",
      due: today,
      priority: "medium",
      description: "",
    });
    setShowModal(false);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Tasks assigned to you across all active projects
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {(["all", "in-progress", "todo", "blocked", "done"] as const).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px capitalize transition-colors whitespace-nowrap ${statusFilter === s ? "border-teal-600 text-teal-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            >
              {s}{" "}
              <span className="ml-0.5 text-xs text-gray-400">
                ({counts[s as keyof typeof counts] ?? 0})
              </span>
            </button>
          ),
        )}
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Filter className="w-3.5 h-3.5" />
        <span>
          {filtered.length} task{filtered.length !== 1 ? "s" : ""}
        </span>
        {counts.blocked > 0 && (
          <span className="ml-2 flex items-center gap-1 text-red-600 font-medium">
            <AlertCircle className="w-3.5 h-3.5" /> {counts.blocked} blocked
          </span>
        )}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filtered.map((t) => {
          const sc = statusConfig[t.status];
          const pc = priorityConfig[t.priority];
          return (
            <div
              key={t.id}
              className={`bg-white rounded-xl border overflow-hidden ${t.status === "blocked" ? "border-red-200" : "border-gray-200"}`}
            >
              <div className="flex items-start gap-4 px-5 py-4">
                <div className="flex-shrink-0 mt-0.5">{sc.icon}</div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${t.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}
                  >
                    {t.name}
                  </p>
                  {t.description && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      {t.project}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due {t.due}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${sc.badge}`}
                  >
                    {sc.label}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <span className={`w-2 h-2 rounded-full ${pc.dot}`} />
                    {pc.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-16 text-center bg-white rounded-xl border border-gray-200">
            <CheckCircle2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">
              No tasks in this category
            </p>
          </div>
        )}
      </div>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">New Task</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Task Name *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Review site drawings"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
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
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Project
                  </label>
                  <select
                    value={form.project}
                    onChange={(e) =>
                      setForm({ ...form, project: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {allProjects.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priority: e.target.value as Task["priority"],
                      })
                    }
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Due Date
                </label>
                <input
                  type="date"
                  value={form.due}
                  onChange={(e) => setForm({ ...form, due: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                onClick={saveTask}
                className="px-4 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700"
              >
                Save Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
