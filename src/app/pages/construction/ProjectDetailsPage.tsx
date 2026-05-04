import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Activity,
  LayoutDashboard,
  Clock,
  ListTodo,
  Wrench,
  Package,
  Cog,
  Receipt,
  FileText,
  History,
  Plus,
  MoreHorizontal,
  Edit,
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronRight,
  Flag,
  Paperclip,
  Search,
  Filter,
  Eye,
} from "lucide-react";

// ─── Shared data ────────────────────────────────────────────────────────────

// TODO: No project details endpoint — using placeholder data
const projects: Record<
  string,
  {
    id: string;
    name: string;
    client: string;
    location: string;
    status: string;
    type: string;
    budget: number;
    spent: number;
    progress: number;
    startDate: string;
    endDate: string;
    manager: string;
    team: number;
    description: string;
  }
> = {
  "1": {
    id: "1",
    name: "Downtown Office Complex",
    client: "Zenith Properties",
    location: "New York, NY",
    status: "Active",
    type: "Commercial",
    budget: 12500000,
    spent: 8125000,
    progress: 65,
    startDate: "2026-01-15",
    endDate: "2026-12-31",
    manager: "John Smith",
    team: 24,
    description:
      "A 22-storey commercial office tower in the heart of Manhattan's business district, inclusive of underground parking, retail spaces, and a rooftop garden terrace.",
  },
  "2": {
    id: "2",
    name: "Riverside Residential",
    client: "HomeKey Developers",
    location: "Austin, TX",
    status: "Active",
    type: "Residential",
    budget: 8200000,
    spent: 4100000,
    progress: 42,
    startDate: "2026-02-01",
    endDate: "2026-09-30",
    manager: "Sarah Johnson",
    team: 18,
    description:
      "A 120-unit residential complex along Riverside Drive featuring modern amenities, a community pool, and landscaped green areas.",
  },
  "3": {
    id: "3",
    name: "Industrial Warehouse",
    client: "LogiPark Ltd",
    location: "Chicago, IL",
    status: "Planning",
    type: "Industrial",
    budget: 5800000,
    spent: 870000,
    progress: 15,
    startDate: "2026-03-10",
    endDate: "2027-02-28",
    manager: "Mike Davis",
    team: 12,
    description:
      "A 50,000 sqft logistics warehouse with dock-level loading bays, cold-storage rooms, and an integrated ERP loading management system.",
  },
  "4": {
    id: "4",
    name: "Shopping Mall Renovation",
    client: "Apex Retail Group",
    location: "Los Angeles, CA",
    status: "On Hold",
    type: "Renovation",
    budget: 18400000,
    spent: 16560000,
    progress: 78,
    startDate: "2025-11-20",
    endDate: "2026-06-30",
    manager: "Emily Chen",
    team: 32,
    description:
      "Full internal and facade renovation of the Apex Centre Mall including new anchor stores, food court expansion, HVAC upgrade, and LED lighting conversion.",
  },
  "5": {
    id: "5",
    name: "Highway Interchange",
    client: "State DOT",
    location: "Dallas, TX",
    status: "Active",
    type: "Infrastructure",
    budget: 32000000,
    spent: 11200000,
    progress: 33,
    startDate: "2026-01-01",
    endDate: "2027-03-31",
    manager: "Robert Lee",
    team: 45,
    description:
      "Construction of a 3-level highway interchange at the intersection of I-35 and I-635 to reduce traffic congestion and improve transit times.",
  },
};

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId =
  | "overview"
  | "schedule"
  | "tasks"
  | "workforce"
  | "materials"
  | "equipment"
  | "expenses"
  | "documents"
  | "activity";

interface Milestone {
  id: string;
  name: string;
  date: string;
  status: "completed" | "in-progress" | "pending" | "at-risk";
}
interface Task {
  id: string;
  name: string;
  parent: string | null;
  assignee: string;
  startDate: string;
  endDate: string;
  status: "todo" | "in-progress" | "done" | "blocked";
  priority: "low" | "medium" | "high" | "critical";
  progress: number;
}
interface Worker {
  id: string;
  name: string;
  role: string;
  phone: string;
  attendance: "present" | "absent" | "leave";
  hoursThisWeek: number;
}
interface Material {
  id: string;
  name: string;
  unit: string;
  required: number;
  used: number;
  ordered: number;
  status: "in-stock" | "low-stock" | "out-of-stock" | "ordered";
}
interface Equipment {
  id: string;
  name: string;
  type: string;
  status: "active" | "idle" | "maintenance";
  assignedFrom: string;
  assignedTo: string;
}
interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: "approved" | "pending" | "rejected";
}
interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  date: string;
  version: string;
}
interface ActivityItem {
  id: string;
  action: string;
  user: string;
  time: string;
  category: string;
}
const milestones: Milestone[] = [];

const tasks: Task[] = [];


const workers: Worker[] = [
  {
    id: "w1",
    name: "James Okafor",
    role: "Site Engineer",
    phone: "+1 555-0101",
    attendance: "present",
    hoursThisWeek: 40,
  },
  {
    id: "w2",
    name: "Carlos Rivera",
    role: "Foreman",
    phone: "+1 555-0102",
    attendance: "present",
    hoursThisWeek: 42,
  },
  {
    id: "w3",
    name: "Aisha Bello",
    role: "Quantity Surveyor",
    phone: "+1 555-0103",
    attendance: "present",
    hoursThisWeek: 38,
  },
  {
    id: "w4",
    name: "Tom Hughes",
    role: "Laborer",
    phone: "+1 555-0104",
    attendance: "absent",
    hoursThisWeek: 24,
  },
  {
    id: "w5",
    name: "Diana Park",
    role: "Safety Officer",
    phone: "+1 555-0105",
    attendance: "present",
    hoursThisWeek: 40,
  },
  {
    id: "w6",
    name: "Samuel Adams",
    role: "Electrician",
    phone: "+1 555-0106",
    attendance: "leave",
    hoursThisWeek: 0,
  },
  {
    id: "w7",
    name: "Linda Chukwu",
    role: "Laborer",
    phone: "+1 555-0107",
    attendance: "present",
    hoursThisWeek: 36,
  },
  {
    id: "w8",
    name: "Kevin Tran",
    role: "Steel Fixer",
    phone: "+1 555-0108",
    attendance: "present",
    hoursThisWeek: 40,
  },
];

const materials: Material[] = [
  {
    id: "mat1",
    name: "Ordinary Portland Cement",
    unit: "Bags",
    required: 8000,
    used: 5200,
    ordered: 8000,
    status: "in-stock",
  },
  {
    id: "mat2",
    name: "Steel Rebars (Y16)",
    unit: "Tonnes",
    required: 120,
    used: 78,
    ordered: 120,
    status: "in-stock",
  },
  {
    id: "mat3",
    name: "Concrete Blocks",
    unit: "Units",
    required: 45000,
    used: 28000,
    ordered: 45000,
    status: "low-stock",
  },
  {
    id: "mat4",
    name: "Structural Steel (I-beams)",
    unit: "Metres",
    required: 3200,
    used: 0,
    ordered: 1200,
    status: "ordered",
  },
  {
    id: "mat5",
    name: "Plywood Formwork",
    unit: "Sheets",
    required: 900,
    used: 620,
    ordered: 900,
    status: "in-stock",
  },
  {
    id: "mat6",
    name: "Electrical Conduit (25mm)",
    unit: "Metres",
    required: 5000,
    used: 0,
    ordered: 0,
    status: "out-of-stock",
  },
];

const equipment: Equipment[] = [
  {
    id: "eq1",
    name: "Tower Crane TC-450",
    type: "Crane",
    status: "active",
    assignedFrom: "2026-01-15",
    assignedTo: "2026-12-31",
  },
  {
    id: "eq2",
    name: "Excavator CAT 320",
    type: "Earthworks",
    status: "idle",
    assignedFrom: "2026-01-20",
    assignedTo: "2026-03-01",
  },
  {
    id: "eq3",
    name: "Concrete Mixer Truck x3",
    type: "Concrete",
    status: "active",
    assignedFrom: "2026-02-06",
    assignedTo: "2026-08-31",
  },
  {
    id: "eq4",
    name: "Hydraulic Platform",
    type: "Access",
    status: "maintenance",
    assignedFrom: "2026-03-01",
    assignedTo: "2026-08-31",
  },
  {
    id: "eq5",
    name: "Dump Truck x2",
    type: "Transport",
    status: "active",
    assignedFrom: "2026-01-15",
    assignedTo: "2026-06-30",
  },
];

const expenses: Expense[] = [
  {
    id: "ex1",
    category: "Materials",
    description: "Cement batch #4 — 2,000 bags",
    amount: 48000,
    date: "2026-03-15",
    status: "approved",
  },
  {
    id: "ex2",
    category: "Labour",
    description: "Fortnightly payroll — Wk 12–13",
    amount: 126000,
    date: "2026-03-28",
    status: "approved",
  },
  {
    id: "ex3",
    category: "Equipment",
    description: "Tower Crane monthly rental",
    amount: 24500,
    date: "2026-04-01",
    status: "approved",
  },
  {
    id: "ex4",
    category: "Materials",
    description: "Steel rebars Y16 — 20 tonnes",
    amount: 67400,
    date: "2026-04-05",
    status: "pending",
  },
  {
    id: "ex5",
    category: "Subcontract",
    description: "Electrical rough-in advance payment",
    amount: 85000,
    date: "2026-04-08",
    status: "pending",
  },
  {
    id: "ex6",
    category: "Misc",
    description: "Safety equipment restock",
    amount: 3200,
    date: "2026-04-09",
    status: "rejected",
  },
];

const docs: Document[] = [
  {
    id: "d1",
    name: "Architectural Drawings v3.2",
    type: "PDF",
    size: "18.4 MB",
    uploadedBy: "John Smith",
    date: "2026-03-01",
    version: "v3.2",
  },
  {
    id: "d2",
    name: "Structural Engineering Report",
    type: "PDF",
    size: "8.9 MB",
    uploadedBy: "Aisha Bello",
    date: "2026-02-14",
    version: "v1.0",
  },
  {
    id: "d3",
    name: "Client Contract — Zenith Properties",
    type: "PDF",
    size: "2.1 MB",
    uploadedBy: "Admin",
    date: "2026-01-10",
    version: "v1.0",
  },
  {
    id: "d4",
    name: "Material Specification Sheet",
    type: "XLSX",
    size: "1.3 MB",
    uploadedBy: "Aisha Bello",
    date: "2026-02-20",
    version: "v2.1",
  },
  {
    id: "d5",
    name: "Site Safety Plan",
    type: "PDF",
    size: "5.6 MB",
    uploadedBy: "Diana Park",
    date: "2026-01-25",
    version: "v1.0",
  },
  {
    id: "d6",
    name: "Progress Photos — March 2026",
    type: "ZIP",
    size: "247 MB",
    uploadedBy: "Carlos Rivera",
    date: "2026-04-01",
    version: "v1.0",
  },
];

const activityLog: ActivityItem[] = [
  {
    id: "a1",
    action: "Foundation milestone updated to 72% complete",
    user: "John Smith",
    time: "2 hours ago",
    category: "milestone",
  },
  {
    id: "a2",
    action: "Task 'Raft Foundation Pour' status changed to In Progress",
    user: "John Smith",
    time: "3 hours ago",
    category: "task",
  },
  {
    id: "a3",
    action: "Expense ₦48,000 approved for Cement batch #4",
    user: "Finance Team",
    time: "5 hours ago",
    category: "expense",
  },
  {
    id: "a4",
    action: "Progress Photos March 2026 uploaded (247MB)",
    user: "Carlos Rivera",
    time: "1 day ago",
    category: "document",
  },
  {
    id: "a5",
    action: "Samuel Adams marked as Leave for current week",
    user: "HR Module",
    time: "1 day ago",
    category: "workforce",
  },
  {
    id: "a6",
    action: "Material request: Structural Steel 1200m approved",
    user: "Procurement",
    time: "2 days ago",
    category: "material",
  },
  {
    id: "a7",
    action: "Hydraulic Platform moved to Maintenance status",
    user: "Equipment Team",
    time: "3 days ago",
    category: "equipment",
  },
  {
    id: "a8",
    action: "Budget utilization reached 65%",
    user: "System",
    time: "4 days ago",
    category: "finance",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

const priorityBadge: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};
const taskStatusBadge: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  "in-progress": "bg-blue-100 text-blue-700",
  todo: "bg-gray-100 text-gray-600",
  blocked: "bg-red-100 text-red-700",
};
const milestoneColor: Record<string, string> = {
  completed: "bg-green-500",
  "in-progress": "bg-blue-500",
  "at-risk": "bg-red-400",
  pending: "bg-gray-300",
};
const attendanceBadge: Record<string, string> = {
  present: "bg-green-100 text-green-700",
  absent: "bg-red-100 text-red-700",
  leave: "bg-amber-100 text-amber-700",
};
const matStatusBadge: Record<string, string> = {
  "in-stock": "bg-green-100 text-green-700",
  "low-stock": "bg-amber-100 text-amber-700",
  "out-of-stock": "bg-red-100 text-red-700",
  ordered: "bg-blue-100 text-blue-700",
};
const eqStatusBadge: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  idle: "bg-gray-100 text-gray-600",
  maintenance: "bg-amber-100 text-amber-700",
};
const expStatusBadge: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  rejected: "bg-red-100 text-red-700",
};
const catLogColor: Record<string, string> = {
  milestone: "bg-blue-500",
  task: "bg-orange-500",
  expense: "bg-green-500",
  document: "bg-purple-500",
  workforce: "bg-pink-500",
  material: "bg-teal-500",
  equipment: "bg-yellow-500",
  finance: "bg-emerald-500",
};

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function OverviewTab({ p }: { p: (typeof projects)[string] }) {
  const budgetPct = Math.round((p.spent / p.budget) * 100);
  return (
    <div className="space-y-5">
      {/* Top summary */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            label: "Budget",
            value: fmt(p.budget),
            sub: `${fmt(p.spent)} spent`,
            icon: <DollarSign className="w-5 h-5" />,
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            label: "Progress",
            value: `${p.progress}%`,
            sub: "Overall completion",
            icon: <Activity className="w-5 h-5" />,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Team",
            value: `${p.team}`,
            sub: "Assigned workers",
            icon: <Users className="w-5 h-5" />,
            color: "text-purple-600 bg-purple-50",
          },
          {
            label: "Due Date",
            value: new Date(p.endDate).toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            sub: `Started ${new Date(p.startDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`,
            icon: <Calendar className="w-5 h-5" />,
            color: "text-orange-600 bg-orange-50",
          },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
          >
            <span className={`p-2.5 rounded-lg ${m.color}`}>{m.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{m.label}</p>
              <p className="text-xl font-bold text-gray-900">{m.value}</p>
              <p className="text-xs text-gray-400">{m.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Description + budget bar */}
        <div className="col-span-2 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">
              Project Description
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {p.description}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Client</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {p.client}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {p.type}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {p.location}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Budget Utilisation
            </h3>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Spent: {fmt(p.spent)}</span>
              <span className="font-medium text-gray-900">{budgetPct}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${budgetPct > 90 ? "bg-red-500" : budgetPct > 75 ? "bg-amber-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(budgetPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>$0</span>
              <span>Total: {fmt(p.budget)}</span>
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Milestones
          </h3>
          <div className="space-y-3">
            {milestones.map((ms, i) => (
              <div key={ms.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-0.5 flex-shrink-0 mt-1">
                  <div
                    className={`w-3 h-3 rounded-full ${milestoneColor[ms.status]}`}
                  />
                  {i < milestones.length - 1 && (
                    <div className="w-px h-5 bg-gray-200" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <p className="text-xs font-medium text-gray-900 leading-snug">
                    {ms.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{ms.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScheduleTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Timeline / Gantt View
        </h3>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
          Jan 2026 — Dec 2026
        </span>
      </div>

      {/* Month headers */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          <div className="flex border-b border-gray-200 pb-1 mb-2">
            <div className="w-52 flex-shrink-0 text-xs font-medium text-gray-500">
              Task
            </div>
            <div className="flex-1 grid grid-cols-12 gap-0">
              {[
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
              ].map((m) => (
                <div
                  key={m}
                  className="text-xs font-medium text-gray-400 text-center"
                >
                  {m}
                </div>
              ))}
            </div>
          </div>
          {tasks
            .filter((t) => !t.parent)
            .map((task) => {
              const s = new Date(task.startDate);
              const e = new Date(task.endDate);
              const startMonth = s.getMonth(); // 0-based
              const endMonth = e.getMonth();
              const spanMonths = Math.max(1, endMonth - startMonth + 1);
              const barColor =
                task.status === "done"
                  ? "bg-green-500"
                  : task.status === "in-progress"
                    ? "bg-orange-500"
                    : "bg-gray-300";
              return (
                <div
                  key={task.id}
                  className="flex items-center py-2 border-b border-gray-50 hover:bg-gray-50 group"
                >
                  <div className="w-52 flex-shrink-0 pr-3">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {task.name}
                    </p>
                    <p className="text-xs text-gray-400">{task.assignee}</p>
                  </div>
                  <div className="flex-1 grid grid-cols-12 gap-0 h-6">
                    {Array.from({ length: 12 }, (_, mi) => {
                      const inSpan = mi >= startMonth && mi <= endMonth;
                      const isFirst = mi === startMonth;
                      const isLast = mi === endMonth;
                      return (
                        <div
                          key={mi}
                          className="h-full flex items-center px-px"
                        >
                          {inSpan && (
                            <div
                              className={`h-4 w-full ${barColor} ${isFirst ? "rounded-l-full" : ""} ${isLast ? "rounded-r-full" : ""} opacity-80`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      <p className="text-xs text-gray-400">
        * Click on tasks for full dependency view. Gantt chart shows top-level
        tasks only.
      </p>
    </div>
  );
}

function TasksTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const filtered = tasks.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
          />
        </div>
        <button
          onClick={() => navigate("/apps/construction/tasks")}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Task Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assignee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Start
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                End
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((task) => (
              <tr
                key={task.id}
                className={`hover:bg-gray-50 ${task.parent ? "bg-gray-50/50" : ""}`}
              >
                <td className="px-4 py-3">
                  <div
                    className={`flex items-center gap-2 ${task.parent ? "pl-6" : ""}`}
                  >
                    {task.parent && (
                      <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm ${task.parent ? "text-gray-600" : "font-medium text-gray-900"}`}
                    >
                      {task.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {task.assignee}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(task.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(task.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityBadge[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${taskStatusBadge[task.status]}`}
                  >
                    {task.status.replace("-", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">
                      {task.progress}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorkforceTab() {
  const navigate = useNavigate();
  const present = workers.filter((w) => w.attendance === "present").length;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Assigned",
            value: workers.length,
            color: "text-blue-600 bg-blue-50",
          },
          {
            label: "Present Today",
            value: present,
            color: "text-green-600 bg-green-50",
          },
          {
            label: "Absent / Leave",
            value: workers.length - present,
            color: "text-red-600 bg-red-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3"
          >
            <span className={`text-2xl font-bold ${s.color.split(" ")[0]}`}>
              {s.value}
            </span>
            <span className="text-sm text-gray-500">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900">
          Assigned Workers
        </h3>
        <button
          onClick={() => navigate("/apps/construction/resource-planning")}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <Plus className="w-3.5 h-3.5" /> Assign Worker
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Attendance
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Hrs This Week
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {workers.map((w) => (
              <tr key={w.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {w.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <span className="font-medium text-gray-900">{w.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{w.role}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{w.phone}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${attendanceBadge[w.attendance]}`}
                  >
                    {w.attendance}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {w.hoursThisWeek}h
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MaterialsTab() {
  const navigate = useNavigate();
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900">
          Materials Register
        </h3>
        <button
          onClick={() => navigate("/apps/construction/approvals")}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <Plus className="w-3.5 h-3.5" /> Request Material
        </button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Material
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Required
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Used
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Ordered
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Utilisation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {materials.map((m) => {
              const pct = Math.round((m.used / m.required) * 100);
              return (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {m.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{m.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {m.required.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {m.used.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {m.ordered.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${pct > 80 ? "bg-red-500" : pct > 60 ? "bg-amber-500" : "bg-orange-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${matStatusBadge[m.status]}`}
                    >
                      {m.status.replace("-", " ")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EquipmentTab() {
  const [eqList, setEqList] = useState(equipment);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    type: "",
    from: "",
    to: "",
  });

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setEqList((prev) => [
      ...prev,
      {
        id: `eq${Date.now()}`,
        name: addForm.name,
        type: addForm.type,
        status: "idle" as const,
        assignedFrom: addForm.from,
        assignedTo: addForm.to,
      },
    ]);
    setShowAdd(false);
    setAddForm({ name: "", type: "", from: "", to: "" });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-900">
          Equipment Assignment
        </h3>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
        >
          <Plus className="w-3.5 h-3.5" /> Add Equipment
        </button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Equipment
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assigned From
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {eqList.map((eq) => (
              <tr key={eq.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {eq.name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{eq.type}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {eq.assignedFrom}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {eq.assignedTo}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${eqStatusBadge[eq.status]}`}
                  >
                    {eq.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 italic">
        Equipment data is synced with the central equipment registry. Full usage
        tracking available in future release.
      </p>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">
                Add Equipment
              </h3>
              <button
                onClick={() => setShowAdd(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="e.g. Bulldozer CAT D6"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={addForm.type}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, type: e.target.value }))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">Select type…</option>
                  {[
                    "Crane",
                    "Earthworks",
                    "Concrete",
                    "Access",
                    "Transport",
                    "Compaction",
                    "Other",
                  ].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned From
                  </label>
                  <input
                    type="date"
                    value={addForm.from}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, from: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assigned To
                  </label>
                  <input
                    type="date"
                    value={addForm.to}
                    onChange={(e) =>
                      setAddForm((f) => ({ ...f, to: e.target.value }))
                    }
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
                >
                  Add Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ExpensesTab() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const approved = expenses
    .filter((e) => e.status === "approved")
    .reduce((s, e) => s + e.amount, 0);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: "Total Recorded",
            value: fmt(total),
            color: "text-gray-900",
          },
          { label: "Approved", value: fmt(approved), color: "text-green-700" },
          {
            label: "Pending Review",
            value: fmt(total - approved),
            color: "text-amber-700",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <p className="text-xs text-gray-500">{s.label}</p>
            <p className={`text-xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Expense Records</h3>
        <p className="text-xs text-gray-400 italic">
          Read-only from Finance module
        </p>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {expenses.map((ex) => (
              <tr key={ex.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                    {ex.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {ex.description}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {fmt(ex.amount)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{ex.date}</td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${expStatusBadge[ex.status]}`}
                  >
                    {ex.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocumentsTab() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [docList, setDocList] = useState(docs);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocList((prev) => [
      ...prev,
      {
        id: `d${Date.now()}`,
        name: file.name,
        type: file.name.split(".").pop()?.toUpperCase() ?? "FILE",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedBy: "You",
        date: new Date().toISOString().split("T")[0],
        version: "v1.0",
      },
    ]);
    showToast(`"${file.name}" uploaded successfully`);
    e.target.value = "";
  }

  const filtered = docList.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg">
          {toastMsg}
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents..."
            className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64"
          />
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-md text-sm font-medium hover:bg-orange-700"
        >
          <Upload className="w-3.5 h-3.5" /> Upload
        </button>
      </div>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Size
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Version
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Uploaded By
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                Date
              </th>
              <th className="px-4 py-3 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((d) => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 text-sm">
                      {d.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                    {d.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{d.size}</td>
                <td className="px-4 py-3 text-xs text-blue-600 font-medium">
                  {d.version}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {d.uploadedBy}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">{d.date}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => showToast(`Previewing "${d.name}"…`)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => showToast(`Downloading "${d.name}"…`)}
                      className="p-1 rounded hover:bg-gray-200 text-gray-400"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActivityTab() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-5">Activity Log</h3>
      <div className="space-y-4">
        {activityLog.map((a, i) => (
          <div key={a.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-1">
              <div
                className={`w-2.5 h-2.5 rounded-full ${catLogColor[a.category] ?? "bg-gray-400"}`}
              />
              {i < activityLog.length - 1 && (
                <div className="w-px flex-1 h-8 bg-gray-200 mt-1" />
              )}
            </div>
            <div className="flex-1 pb-2 border-b border-gray-50 last:border-0">
              <p className="text-sm text-gray-900">{a.action}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-xs text-gray-400">
                  by <span className="text-gray-600 font-medium">{a.user}</span>
                </p>
                <span className="text-gray-300">·</span>
                <p className="text-xs text-gray-400">{a.time}</p>
                <span className="text-gray-300">·</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded capitalize">
                  {a.category}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  { id: "schedule", label: "Schedule", icon: <Clock className="w-4 h-4" /> },
  { id: "tasks", label: "Tasks / WBS", icon: <ListTodo className="w-4 h-4" /> },
  { id: "workforce", label: "Workforce", icon: <Users className="w-4 h-4" /> },
  {
    id: "materials",
    label: "Materials",
    icon: <Package className="w-4 h-4" />,
  },
  { id: "equipment", label: "Equipment", icon: <Cog className="w-4 h-4" /> },
  { id: "expenses", label: "Expenses", icon: <Receipt className="w-4 h-4" /> },
  {
    id: "documents",
    label: "Documents",
    icon: <FileText className="w-4 h-4" />,
  },
  { id: "activity", label: "Activity", icon: <History className="w-4 h-4" /> },
];

const statusBadge: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Planning: "bg-blue-100 text-blue-700",
  "On Hold": "bg-amber-100 text-amber-700",
  Completed: "bg-gray-100 text-gray-600",
};

export function ProjectDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showEdit, setShowEdit] = useState(false);
  const [pOverride, setPOverride] = useState<{
    name: string;
    status: string;
    progress: number;
    manager: string;
  } | null>(null);

  const p = projects[id ?? "1"] ?? projects["1"];
  const pDisplay = pOverride ? { ...p, ...pOverride } : p;

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div>
        <button
          onClick={() => navigate("/apps/construction")}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-semibold text-gray-900">
                  {pDisplay.name}
                </h1>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusBadge[pDisplay.status] ?? "bg-gray-100 text-gray-600"}`}
                >
                  {pDisplay.status}
                </span>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  {p.type}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {p.location}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  {pDisplay.manager}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" />
                  {p.client}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(p.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  →{" "}
                  {new Date(p.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 max-w-xs bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${pDisplay.progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {pDisplay.progress}% complete
                </span>
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => {
                  setPOverride({
                    name: pDisplay.name,
                    status: pDisplay.status,
                    progress: pDisplay.progress,
                    manager: pDisplay.manager,
                  });
                  setShowEdit(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
              >
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-orange-600 text-orange-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-5">
          {activeTab === "overview" && <OverviewTab p={p} />}
          {activeTab === "schedule" && <ScheduleTab />}
          {activeTab === "tasks" && <TasksTab />}
          {activeTab === "workforce" && <WorkforceTab />}
          {activeTab === "materials" && <MaterialsTab />}
          {activeTab === "equipment" && <EquipmentTab />}
          {activeTab === "expenses" && <ExpensesTab />}
          {activeTab === "documents" && <DocumentsTab />}
          {activeTab === "activity" && <ActivityTab />}
        </div>
      </div>

      {/* Edit Project Modal */}
      {showEdit && pOverride && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">
                Edit Project Info
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowEdit(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  value={pOverride.name}
                  onChange={(e) =>
                    setPOverride((o) => o && { ...o, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={pOverride.status}
                  onChange={(e) =>
                    setPOverride((o) => o && { ...o, status: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {[
                    "Active",
                    "Planning",
                    "On Hold",
                    "Completed",
                    "Cancelled",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress ({pOverride.progress}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pOverride.progress}
                  onChange={(e) =>
                    setPOverride(
                      (o) => o && { ...o, progress: Number(e.target.value) },
                    )
                  }
                  className="w-full accent-orange-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Manager
                </label>
                <input
                  type="text"
                  value={pOverride.manager}
                  onChange={(e) =>
                    setPOverride((o) => o && { ...o, manager: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
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
    </div>
  );
}
